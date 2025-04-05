const express = require("express")
const bodyParser = require("body-parser")
const mysql = require("mysql2")
const ejs = require("ejs")
const cookieParser = require("cookie-parser")
const path = require("path")
const fs = require("fs")
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const fetch = require('node-fetch');
const cors = require('cors')
const multer = require('multer');
const { exec, spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config()

const PORT = 7070
let app = express()
app.use(cookieParser("secret"))
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../client/src/pages'))
app.use(express.static(path.join(__dirname, '../client/src')))
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.json())
app.use(cors({ origin: '*' }));
let urlencodedParser = bodyParser.urlencoded({ extended: false })

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
})

app.use((req, res, next) => {
    if (!req.cookies.userID) {
        if (!req.cookies.guestID) {
            const guestID = uuidv4().split('-')[0];
            res.cookie('guestID', guestID, {
                httpOnly: true,
                maxAge: 30 * 24 * 60 * 60 * 1000 // 30 дней
            });
            req.guestID = guestID;
        } else {
            req.guestID = req.cookies.guestID;
        }
    } else {
        req.userID = req.cookies.userID;
    }
    next();
});

app.get('/', (req, res) => {
    const userID = req.cookies.userID || req.cookies.guestID
    console.log(userID)
    res.render("explore")
});

app.post('/get-user-data', (req, res)=>{
    res.set('views', path.join(__dirname, '../uploads')); 

    const userID = req.cookies.userID || req.cookies.guestID;

    if (!userID) {
        return res.status(401).json({ success: false, message: 'Вы не авторизованы' });
    }

    const query = "SELECT * FROM users WHERE id = ?";

    connection.query(query, [userID], (err, results) => {
        if (err) {
            console.error("Error querying data:", err);
            return res.status(500).json({ success: false, message: 'Database query error' });
        }

        if (results.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        res.json({ success: true, message: 'User authenticated successfully!', user: results[0] });
    });
})

app.get('/get-videos-with-progress', (req, res) => {
    const userID = req.cookies.userID || req.cookies.guestID;

    if (!userID) {
        return res.status(400).json({ error: 'userID обязателен' });
    }

    const query = `
        SELECT 
            videos.id, 
            videos.filename,
            videos.title, 
            videos.banner, 
            videos.video_seconds,
            COALESCE(views.watched_seconds, 0) AS watched_seconds
        FROM videos
        LEFT JOIN views ON videos.filename = views.video_id AND views.user_id = ?
    `;

    connection.query(query, [userID], (err, results) => {
        if (err) {
            console.error("Ошибка запроса к базе данных:", err);
            return res.status(500).json({ success: false, message: 'Database query error' });
        }

        res.json({ success: true, videoData: results });
    });
});



app.get('/channel', (req, res) => {
    res.render("channel")
});

app.get('/playlist', (req, res) => {
    res.render("playlist")
});

app.get('/watch', (req, res) => {
    res.render("watchVideo")
});

app.get('/history', (req, res) => {
    res.render("history")
});

app.get('/studio', (req, res) => {
    res.render("studio")
});

app.get('/settings', (req, res) => {
    res.render("settings")
});

app.get('/uploadVideo', (req, res) => {
    res.render("uploadVideo")
});

app.get('/authentication', (req, res) => {
    res.render("authentication")
});

const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000)
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'huseynsharipov08@gmail.com',
        pass: process.env.PASSWORDGMAIL,
    },
});

let codeGenerationTime = null;
let verificationCode = null;

app.post('/check-email', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    try {
        verificationCode = generateCode();
        codeGenerationTime = Date.now();

        await transporter.sendMail({
            from: 'huseynsharipov08@gmail.com',
            to: email,
            subject: 'Verification Code',
            text: `Your verification code is: ${verificationCode}`,
        });

        console.log(`Email sent to ${email} with code: ${verificationCode}`);

        res.status(200).json({
            exists: true,
            message: 'Verification code sent to email.',
        });
    } catch (error) {
        console.error('Error sending email:', error);

        res.status(404).json({
            exists: false,
            message: 'Email does not exist or is unreachable.',
        });
    }
});

app.post('/check-code', async (req, res) => {
    const { code } = req.body;
    if (!code) {
        return res.status(400).json({ message: 'Code is required.' });
    }

    try {
        if (codeGenerationTime && (Date.now() - codeGenerationTime > 300000)) { 
            return res.status(400).json({ message: 'Verification code has expired.' });
        }

        if (code == verificationCode) {
            res.status(200).json({
                exists: true,
                message: 'Verification code is valid.',
            });
        } else {
            res.status(400).json({
                exists: false,
                message: 'Incorrect verification code.',
            });
        }
    } catch (error) {
        res.status(500).json({
            exists: false,
            message: 'An error occurred during verification.',
        });
    }
});

const SECRET_KEY_REGISTER = process.env.SECRET_KEY_REGISTER; 
const SECRET_KEY_LOGIN = process.env.SECRET_KEY_LOGIN; 

const secretKeys = {
    register: SECRET_KEY_REGISTER,
    login: SECRET_KEY_LOGIN,
};

app.post('/verify-recaptcha', async (req, res) => {
    const { token, type } = req.body;
    if (!token || !type || !secretKeys[type]) {
        return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    const secretKey = secretKeys[type]

    try {
        const response = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                secret: secretKey,
                response: token,
            }),
        });

        const data = await response.json();

        if (data.success) {
            return res.json({ success: true });
        } else {
            return res.status(400).json({ success: false, message: 'reCAPTCHA validation failed' });
        }
    } catch (error) {
        console.error('Error verifying reCAPTCHA:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});


const parentDir = path.dirname(__dirname);
const processingDir = path.join(parentDir, 'uploads', 'processing');
if (!fs.existsSync(processingDir)) {
    fs.mkdirSync(processingDir, { recursive: true });
}

const storageProcessing = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, processingDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, uniqueSuffix + extension);
    }
});

const uploadProcessing = multer({ storage: storageProcessing });

app.post('/upload-avatar', uploadProcessing.single('avatar'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const inputFilePath = req.file.path;
        const outputDir = path.join(parentDir, 'uploads', 'avatars');

        fs.mkdirSync(outputDir, { recursive: true });
        const outputFilePath = path.join(outputDir, req.file.filename);

        fs.renameSync(inputFilePath, outputFilePath);

        res.status(200).json({
            success: true,
            message: 'Avatar uploaded successfully',
            filename: req.file.filename,
        });
    } catch (error) {
        console.error('Error processing avatar:', error);
        res.status(500).json({ success: false, message: 'Error processing avatar' });
    }
});

app.post('/upload-banner', uploadProcessing.single('banner'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const inputFilePath = req.file.path;
        const outputDir = path.join(parentDir, 'uploads', 'banners');

        await fs.promises.mkdir(outputDir, { recursive: true });
        const outputFilePath = path.join(outputDir, req.file.filename);

        await fs.promises.rename(inputFilePath, outputFilePath);

        res.status(200).json({
            success: true,
            message: 'Banner uploaded successfully',
            filename: req.file.filename
        });
    } catch (error) {
        console.error('Error processing banner:', error);
        res.status(500).json({ success: false, message: 'Error processing banner' });
    }
});

const processingStatus = {}
const { execSync } = require('child_process');

const getVideoDuration = (filePath) => {
    try {
        const output = execSync(
            `ffprobe -i "${filePath}" -show_entries format=duration -v quiet -of csv="p=0"`
        );
        return parseFloat(output.toString().trim());
    } catch (error) {
        console.error('Ошибка при получении длительности видео:', error);
        return null;
    }
};

app.post('/uploadVideo', uploadProcessing.single('video'), (req, res) => {
    const userID = req.cookies.userID;
    if (!userID) {
        return res.json({ redirectUrl: '/authentication' });
    }

    const taskId = Date.now().toString();
    const inputFilePath = req.file.path;
    const outputDir = path.join(parentDir, 'uploads', 'videos', taskId);

    fs.mkdirSync(outputDir, { recursive: true });

    processingStatus[taskId] = {
        status: 'processing',
        progress: 0,
        resolution: null,
    };

    const resolutions = [
        { name: '1080p', width: 1920, height: 1080, bitrate: '5000k' },
        { name: '720p', width: 1280, height: 720, bitrate: '2500k' },
        { name: '480p', width: 854, height: 480, bitrate: '1200k' }
    ];

    let processedFiles = 0;

    const processVideo = (resolution) => {
        const outputFile = path.join(outputDir, `${resolution.name}.m3u8`);
        const sizeOption = `-s ${resolution.width}x${resolution.height}`;
        const ffmpegCommand = `
            ffmpeg -i ${inputFilePath} -preset ultrafast -g 48 -sc_threshold 0 \
            -map 0:v -map 0:a -b:v ${resolution.bitrate} ${sizeOption} \
            -c:v h264 -c:a aac -strict -2 -f hls -hls_time 10 -hls_playlist_type vod \
            -hls_segment_filename "${outputDir}/${resolution.name}_%03d.ts" ${outputFile}`;
        

        exec(ffmpegCommand, (error) => {
            if (error) {
                console.error(`Ошибка при обработке ${resolution.name}:`, error);
                processingStatus[taskId].status = 'error';
                return;
            }

            processedFiles++;
            processingStatus[taskId] = {
                status: processedFiles === resolutions.length ? 'complete' : 'processing',
                progress: Math.round((processedFiles / resolutions.length) * 100),
                resolution: resolution.name,
            };

            if (processedFiles === resolutions.length) {
                createMasterPlaylist(outputDir, taskId, resolutions);
                fs.unlinkSync(inputFilePath);
            }
        });
    };

    const createMasterPlaylist = (dir, taskId, resolutions) => {
        const masterPlaylist = path.join(dir, 'master.m3u8');
        let content = '#EXTM3U\n';

        resolutions.forEach((res) => {
            content += `#EXT-X-STREAM-INF:BANDWIDTH=${parseInt(res.bitrate) * 1000},RESOLUTION=${res.width}x${res.height}\n`;
            content += `${res.name}.m3u8\n`;
        });

        fs.writeFileSync(masterPlaylist, content);
        console.log(`Создан master.m3u8 для ${taskId}`);
    };

    resolutions.forEach((res) => processVideo(res));

    const duration = getVideoDuration(inputFilePath);
    res.json({ taskId, message: 'Обработка началась', duration});
});


app.get('/uploadStatus/:taskId', (req, res) => {
    const taskId = req.params.taskId;
    if (processingStatus[taskId]) {
        res.json(processingStatus[taskId]);
    } else {
        res.status(404).json({ error: 'Задача не найдена' });
    }
});

app.post('/upload-data-video', async (req, res) => {
    const userID = req.cookies.userID;
    const { dataUser, tags } = req.body;

    if (!userID) {
        return res.json({ redirectUrl: '/authentication' });
    }

    if (!dataUser || !tags) {
        return res.status(400).json({ success: false, message: 'No video data provided' });
    }

    dataUser.user_id = userID;

    try {
        // 1. Сохраняем видео в БД
        connection.query("INSERT INTO videos SET ?", dataUser, (err, result) => {
            if (err) {
                console.error("Error inserting video data:", err);
                return res.status(500).json({ success: false, message: 'Database insertion error' });
            }

            const videoID = result.insertId;

            // // 2. Добавляем теги в БД (если их еще нет)
            // const tagInsertPromises = tags.map(tag => {
            //     return new Promise((resolve, reject) => {
            //         connection.query("INSERT IGNORE INTO tags (name) VALUES (?)", [tag], (err, tagResult) => {
            //             if (err) reject(err);
            //             resolve(tagResult.insertId || tag);
            //         });
            //     });
            // });

            // Promise.all(tagInsertPromises)
            //     .then(tagIDs => {
            //         // 3. Добавляем связи в `video_tags`
            //         const videoTagValues = tagIDs.map(tagID => [videoID, tagID]);

            //         connection.query("INSERT INTO video_tags (video_id, tag_id) VALUES ?", [videoTagValues], (err) => {
            //             if (err) {
            //                 console.error("Error inserting video tags:", err);
            //                 return res.status(500).json({ success: false, message: 'Database error on tags' });
            //             }

            //             res.json({ success: true, message: 'Video data uploaded successfully!' });
            //         });
            //     })
            //     .catch(err => {
            //         console.error("Error processing tags:", err);
            //         res.status(500).json({ success: false, message: 'Error processing tags' });
            //     });
        });

    } catch (err) {
        console.error("Server error:", err);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

app.post('/login', async (req, res) => {
    const { loginData } = req.body;

    if (!loginData) {
        return res.status(400).json({ success: false, message: 'Некорректные данные для входа' });
    }

    const { email, password } = loginData;

    connection.query('SELECT * FROM users WHERE email = ?', [email], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Ошибка сервера' });
        }

        if (result.length === 0) {
            return res.status(401).json({ success: false, message: 'Неправильный email или пароль' });
        }

        const user = result[0];

        bcrypt.compare(password, user.password, async (err, isMatch) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Ошибка сервера' });
            }

            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Неверный пароль' });
            }

            const guestID = req.cookies.guestID;

            if (guestID) {
                try {
                    const [existingViews] = await connection.promise().query(
                        'SELECT video_id FROM views WHERE user_id = ?',
                        [user.id]
                    );

                    const existingVideoIds = new Set(existingViews.map(row => row.video_id));

                    if (existingVideoIds.size > 0) {
                        await connection.promise().query(`
                            INSERT INTO views (user_id, video_id, watched_seconds, views_date)
                            SELECT ?, video_id, watched_seconds, views_date FROM views 
                            WHERE user_id = ? AND video_id NOT IN (${[...existingVideoIds].map(() => '?').join(',')})
                        `, [user.id, guestID, ...existingVideoIds]);
                    } else {
                        await connection.promise().query(`
                            INSERT INTO views (user_id, video_id, watched_seconds, views_date)
                            SELECT ?, video_id, watched_seconds, views_date FROM views 
                            WHERE user_id = ?
                        `, [user.id, guestID]);
                    }

                    await connection.promise().query(`DELETE FROM views WHERE user_id = ?`, [guestID]);

                } catch (error) {
                    console.error('Ошибка при обновлении данных пользователя:', error);
                    return res.status(500).json({ success: false, message: 'Ошибка при переносе данных' });
                }
            }

            res.clearCookie('guestID');
            res.cookie('userID', user.id, {
                httpOnly: true,
                maxAge: 3600000 // 1 час
            });

            res.json({ success: true, message: 'Успешный вход' });
        });
    });
});

app.post('/upload-user-data', async (req, res) => {
    try {
        const { dataUser } = req.body;

        if (!dataUser || !dataUser.password || !dataUser.email || !dataUser.name) {
            return res.status(400).json({ success: false, message: 'Некорректные данные' });
        }

        const [existingUser] = await connection.promise().query(
            'SELECT id FROM users WHERE email = ?',
            [dataUser.email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ success: false, message: 'Email уже используется' });
        }

        const hashedPassword = await bcrypt.hash(dataUser.password, 15);

        const query = `
            INSERT INTO users (name, surname, email, password, avatarImage, slug) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const [result] = await connection.promise().query(query, [
            dataUser.name,
            dataUser.surname,
            dataUser.email,
            hashedPassword,
            dataUser.avatarImage || null,
            dataUser.slug
        ]);

        const newUserId = result.insertId;
        const guestID = req.cookies.guestID; 

        if (guestID) {
            await connection.promise().query(
                'UPDATE views SET user_id = ? WHERE user_id = ?',
                [newUserId, guestID]
            );
            await connection.promise().query(`DELETE FROM views WHERE user_id = ?`, [guestID]);
        }

        res.clearCookie('guestID');
        res.cookie('userID', newUserId, {
            httpOnly: true,
            maxAge: 3600000 // 1 час
        });

        res.json({ success: true, message: 'Регистрация успешна', userID: newUserId });

    } catch (error) {
        console.error('Ошибка регистрации:', error);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});


app.post('/settings-get-user-data', async (req, res)=>{
    const userID = req.cookies.userID

    if(!userID){
        return res.status(302).json({ redirectUrl: '/authentication' });
    }

    connection.query(`SELECT * FROM users WHERE id = ?`, [userID], (err, result)=>{
        if(err){
            res.status(500).json({ success: false, message: 'Ошибка на сервере' });
        }

        res.json({ success: true, message: 'Данные пользователя успешно добавлены!', userData: result });
    })
})

app.post('/get-studio-data', async (req, res) => {
    const userID = req.cookies.userID;

    if (!userID) {
        return res.json({ redirectUrl: '/authentication' });
    }

    connection.query('SELECT * FROM videos WHERE user_id = ?', [userID], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Ошибка на сервере' });
        }

        if (result.length === 0) {
            return res.status(404).json({ success: false, message: 'No videos in Studio' });
        }

        return res.json({ success: true, message: 'Studio successfully!', studio: result });
    });
});

app.post('/delete-video', async(req, res)=>{
    const {videoID, videoPath, videoBanner} = req.body
    const videoDir = path.join(parentDir, 'uploads', 'videos', videoPath);
    const bannerDir = path.join(parentDir, 'uploads', 'banners', videoBanner);

    if(!videoID){
        res.status(204).json({ success: false, message: 'No data available' });
    }

    connection.query(`DELETE FROM videos WHERE id = ?`, [videoID], (err, result)=>{
        if(err){
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Ошибка на сервере' });
        }

        fs.rm(videoDir, { recursive: true, force: true }, (err) => {
            if (err) {
                console.error('Ошибка при удалении папки с видео:', err);
            }

            fs.unlink(bannerDir, (err) => {
                if (err) {
                    console.error('Ошибка при удалении баннера:', err);
                }

                res.json({ success: true, message: 'Видео и баннер удалены' });
            });
        });
    })
})

app.post('/update-video', async (req, res) => {
    try {
        const { videoID, newTitle, newDescription } = req.body;

        if (!videoID || !newTitle || !newDescription) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        connection.query(`SELECT * FROM videos WHERE id = ?`, [videoID], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }

            if (results.length === 0) {
                return res.status(404).json({ success: false, message: 'Video not found' });
            }

            connection.query(
                `UPDATE videos SET title = ?, discription = ? WHERE id = ?`,
                [newTitle, newDescription, videoID],
                (err, result) => {
                    if (err) {
                        console.error('Error updating video:', err);
                        return res.status(500).json({ success: false, message: 'Database update error' });
                    }

                    return res.json({ success: true, message: 'Video updated successfully' });
                }
            );
        });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});


app.post('/get-video-data', (req, res) => {
    const { videoID } = req.body;

    if (!videoID) {
        return res.status(400).json({ success: false, message: "Video ID is required" });
    }

    const query = `
        SELECT videos.id, videos.filename, videos.title, videos.discription, 
        videos.banner, videos.uploaded_at, videos.video_seconds, 
        users.avatarImage, users.id AS user_id, users.slug 
        FROM videos 
        JOIN users ON videos.user_id = users.id 
        WHERE videos.filename = ?
        GROUP BY videos.id
    `;


    connection.query(query, [videoID], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error' });
        } else if (result.length === 0) {
            return res.status(404).json({ success: false, message: "Video not found" });
        }
        
        return res.json({ 
            success: true, 
            message: 'Video found successfully', 
            videoData: result[0] 
        });
    });
});


app.use('/videos', express.static(path.join(parentDir, 'uploads', 'videos')));

app.get('/watchVideo', (req, res) => {
    const videoID = req.query.videoID;
    const quality = req.query.quality || "master"; 

    if (!videoID) {
        return res.status(400).json({ success: false, message: "Video ID is required" });
    }

    const videoPath = path.join(parentDir, 'uploads', 'videos', videoID, `${quality}.m3u8`);

    if (!fs.existsSync(videoPath)) {
        console.error("Плейлист не найден:", videoPath);
        return res.status(404).json({ success: false, message: "Playlist not found" });
    }

    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    fs.createReadStream(videoPath).pipe(res);
});

app.get('/videos/:videoID/:segment', (req, res) => {
    const { videoID, segment } = req.params;
    const segmentPath = path.join(parentDir, 'uploads', 'videos', videoID, segment);

    if (!fs.existsSync(segmentPath)) {
        console.error("Сегмент не найден:", segmentPath);
        return res.status(404).json({ success: false, message: "Segment not found" });
    }

    res.setHeader("Content-Type", "video/MP2T");
    fs.createReadStream(segmentPath).pipe(res);
});

app.post('/views', async (req, res) => {
    let { watched_seconds, video_id } = req.body;
    const userID = req.cookies.userID;
    const guestID = req.cookies.guestID;
    
    if (!video_id || watched_seconds === undefined) {
        return res.status(400).json({ error: 'watched_seconds or video_id is required' });
    }

    watched_seconds = Math.round(watched_seconds); 

    const sql = `
        INSERT INTO views (user_id, video_id, watched_seconds, views_date)
        VALUES (?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE 
            watched_seconds = VALUES(watched_seconds),
            views_date = NOW();
    `;

    connection.query(sql, [userID || guestID, video_id, watched_seconds], (err, result) => {
        if (err) {
            console.error('Ошибка базы данных:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.status(200).json({ message: 'Данные успешно обновлены' });
    });
});

app.get('/get-video-progress', (req, res) => {
    const videoID = req.query.query;
    const userID = req.cookies.userID || req.cookies.guestID;

    if (!videoID || !userID) {
        return res.status(400).json({ error: 'videoID и userID обязательны' });
    }

    const sql = `SELECT watched_seconds FROM views WHERE user_id = ? AND video_id = ?`;

    connection.query(sql, [userID, videoID], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (result.length > 0) {
            res.json({ progress: result[0].watched_seconds });
        } else {
            res.json({ progress: 0 })
        }

        res.status(200)
    });
});

app.post('/get-history', async (req, res)=>{
    const userID = req.cookies.userID
    const guestID = req.cookies.guestID

    const query = `
    SELECT 
    v.video_id, 
    v.view_id, 
    v.watched_seconds, 
    v.views_date, 
    vid.id, 
    vid.banner, 
    vid.title, 
    vid.filename, 
    vid.uploaded_at, 
    vid.video_seconds
    FROM views v
    JOIN videos vid ON v.video_id = vid.filename
    WHERE v.user_id = ?;`;

    connection.query(query, [userID || guestID], (err, result)=>{
        if(err){
            console.log(err)
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        res.status(200).json({ historyData: result })
    })
})

app.post('/delete-history', async (req, res) => {
    const userID = req.cookies.userID || req.cookies.guestID;
    const { viewID } = req.body;

    if (!userID) {
        return res.status(400).json({ error: 'userID обязателен' });
    }

    let query, params;

    if (viewID) {
        query = 'DELETE FROM views WHERE view_id = ? AND user_id = ?';
        params = [viewID, userID];
    } else {
        query = 'DELETE FROM views WHERE user_id = ?';
        params = [userID];
    }

    connection.query(query, params, (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        res.status(200).json({ success: true, message: viewID ? 'Видео удалено' : 'Вся история очищена' });
    });
});

app.post('/update-likes', async (req, res) => {
    const { videoID, likeStatus } = req.body;
    const { userID } = req.cookies;

    if (!videoID || userID === undefined) {
        return res.status(400).json({ success: false, message: "Ошибка: Недостаточно данных!" });
    }

    const checkQuery = `SELECT * FROM likes_dislikes WHERE video_id = ? AND user_id = ?`;
    connection.query(checkQuery, [videoID, userID], (err, results) => {
        if (err) {
            console.error("Ошибка базы данных:", err);
            return res.status(500).json({ success: false, message: "Ошибка базы данных" });
        }

        if (results.length === 0) {
            if (likeStatus !== null) {
                const insertQuery = `INSERT INTO likes_dislikes (video_id, user_id, like_status) VALUES (?, ?, ?)`;
                connection.query(insertQuery, [videoID, userID, likeStatus], (err) => {
                    if (err) {
                        console.error("Ошибка базы данных:", err);
                        return res.status(500).json({ success: false, message: "Ошибка базы данных" });
                    }
                    return res.json({ success: true });
                });
            } else {
                return res.json({ success: true });
            }
        } else {
            if (likeStatus === null) {
                const deleteQuery = `DELETE FROM likes_dislikes WHERE video_id = ? AND user_id = ?`;
                connection.query(deleteQuery, [videoID, userID], (err) => {
                    if (err) {
                        console.error("Ошибка базы данных:", err);
                        return res.status(500).json({ success: false, message: "Ошибка базы данных" });
                    }
                    return res.json({ success: true });
                });
            } else {
                const updateQuery = `UPDATE likes_dislikes SET like_status = ? WHERE video_id = ? AND user_id = ?`;
                connection.query(updateQuery, [likeStatus, videoID, userID], (err) => {
                    if (err) {
                        console.error("Ошибка базы данных:", err);
                        return res.status(500).json({ success: false, message: "Ошибка базы данных" });
                    }
                    return res.json({ success: true });
                });
            }
        }
    });
});

app.get("/get-like-status", async (req, res) => {
    const { videoID} = req.query;
    const {userID } = req.cookies;

    if (!videoID) {
        return res.status(400).json({ error: "videoID отсутствует" });
    }

    const queryTotalLikes = "SELECT COUNT(*) AS like_count FROM likes_dislikes WHERE video_id = ? AND like_status = 1";

    const queryUserLikeStatus = "SELECT like_status FROM likes_dislikes WHERE video_id = ? AND user_id = ?";

    connection.query(queryTotalLikes, [videoID], (err, totalResult) => {
        if (err) {
            console.error("Ошибка SQL:", err);
            return res.status(500).json({ error: "Ошибка базы данных" });
        }

        const likeCount = totalResult[0].like_count;

        if (!userID) {
            return res.json({
                like_count: likeCount,
                like_status: null,
            });
        }

        connection.query(queryUserLikeStatus, [videoID, userID], (err, userResult) => {
            if (err) {
                console.error("Ошибка SQL:", err);
                return res.status(500).json({ error: "Ошибка базы данных" });
            }

            const likeStatus = userResult.length > 0 ? userResult[0].like_status : null;

            res.json({
                like_count: likeCount,
                like_status: likeStatus,
            });
        });
    });
});

app.get('/get-subscribe-status', async (req, res)=>{
    const { channelID } = req.query
    const { userID } = req.cookies

    if (!channelID) {
        return res.status(400).json({ error: "channelID отсутствует" });
    }

    const queryTotalSubscribe = "SELECT COUNT(*) AS subscribe_count FROM subscriptions WHERE channel_id = ?";

    const queryUserSubscribeStatus = "SELECT * FROM subscriptions WHERE channel_id = ? AND subscriber_id = ?";

    connection.query(queryTotalSubscribe, [channelID], (err, totalResult) => {
        if (err) {
            console.error("Ошибка SQL:", err);
            return res.status(500).json({ error: "Ошибка базы данных" });
        }
        const subscribeCount = totalResult[0].subscribe_count;

        if (!userID) {
            return res.json({
                subscribe_count: subscribeCount,
                subscribe_status: null,
            });
        }

        connection.query(queryUserSubscribeStatus, [channelID, userID], (err, userResult) => {
            if (err) {
                console.error("Ошибка SQL:", err);
                return res.status(500).json({ error: "Ошибка базы данных" });
            }

            const subscribeStatus = userResult.length > 0 ? userResult[0].subscriber_id : null;
            res.json({
                subscribe_count: subscribeCount,
                subscribe_status: subscribeStatus,
            });
        });
    });
})

app.post('/subscribe-to-channel', async (req, res) => {
    const { channelID } = req.body;
    const { userID } = req.cookies;

    if (!userID) {
        return res.json({ redirectUrl: '/authentication' });
    }

    const checkQuery = 'SELECT * FROM subscriptions WHERE channel_id = ? AND subscriber_id = ?';
    const insertQuery = 'INSERT INTO subscriptions (subscriber_id, channel_id, subscribe_timestamp) VALUES (?, ?, NOW())';
    const deleteQuery = 'DELETE FROM subscriptions WHERE channel_id = ? AND subscriber_id = ?';

    connection.query(checkQuery, [channelID, userID], (err, result) => {
        if (err) {
            console.error("Ошибка SQL:", err);
            return res.status(500).json({ error: "Ошибка базы данных" });
        }

        if (result.length > 0) {
            connection.query(deleteQuery, [channelID, userID], (err) => {
                if (err) {
                    console.error("Ошибка SQL при удалении подписки:", err);
                    return res.status(500).json({ error: "Ошибка базы данных" });
                }
                return res.json({ message: "Вы отписались от канала", subscribed: false });
            });
        } else {
            connection.query(insertQuery, [userID, channelID], (err) => {
                if (err) {
                    console.error("Ошибка SQL при добавлении подписки:", err);
                    return res.status(500).json({ error: "Ошибка базы данных" });
                }
                return res.json({ message: "Вы подписались на канал", subscribed: true });
            });
        }
    });
});

app.get('/add-sub', async (req, res) => {
    for (let i = 20; i <= 15000; i++) {
        connection.query(
            'INSERT INTO subscriptions (subscriber_id, channel_id, subscribe_timestamp) VALUES (?, ?, NOW())', 
            [i, 12], 
            (err, result) => {
                if (err) {
                    console.error("Ошибка SQL:", err);
                }
            }
        );
    }
    res.send({ success: true, message: "Подписчики добавлены!" });
});

app.post('/add-comment', async(req, res)=>{
    const { videoID, comment } = req.body
    const { userID } = req.cookies

    if(!userID){
        return res.json({ redirectUrl: '/authentication' })
    } else if(!videoID || !comment){
        return res.status(400).json({ error: "Not found videoID or comment" });
    }
    try{
        connection.query('INSERT INTO comments (user_id, video_id, content) VALUES (?, ?, ?)', [userID, videoID, comment], (err, result)=>{
            if (err) {
                console.error("Ошибка SQL при удалении подписки:", err);
                return res.status(500).json({ error: "Ошибка базы данных" });
            }
            const commentID = result.insertId;

            connection.query(`SELECT 
                comments.*,
                users.avatarImage,
                users.slug
                FROM comments
                JOIN users ON comments.user_id = users.id
                WHERE comments.id = ?
                `, [commentID],
                (err, rows) => {
                    if (err) {
                        console.error("Ошибка при получении комментария:", err);
                        return res.status(500).json({ error: "Ошибка при получении данных" });
                    }

                    return res.json({
                        message: "Комментарий успешно добавлен!",
                        comment: rows[0]
                    });
                });
        })

    }catch(err){
        return res.status(400).json({ error: "Error loading data into DB" });
    }
})

app.post('/delete-comment', async(req, res)=>{
    const {commentID} = req.body
    const {userID} = req.cookies

    if(!userID){
        return res.json({ redirectUrl: '/authentication' })
    } else if(!commentID){
        return res.status(400).json({ error: "Not found videoID or commentID" });
    }

    try{
        connection.query('DELETE FROM comments WHERE id = ?', [commentID], (err, result)=>{
            if (err) {
                console.error("Ошибка SQL при удалении подписки:", err);
                return res.status(500).json({ error: "Ошибка базы данных" });
            }
            return res.json({ message: "Коментарие успешно удален!" });
        })

    }catch(err){
        return res.status(400).json({ error: "Error loading data into DB" });
    }
})

app.get('/get-comments', async (req, res) => {
    const videoID = req.query.query;
    const { userID } = req.cookies;

    if (!videoID) {
        return res.status(400).json({ error: "Not found videoID or userID" });
    }

    const sql = `
        SELECT c.*, u.avatarImage, u.slug, 
        (SELECT COUNT(*) FROM comments sub WHERE sub.parent_id = c.id) AS replies_count 
        FROM comments c 
        JOIN users u ON c.user_id = u.id 
        WHERE c.video_id = ? AND c.parent_id IS NULL
        ORDER BY c.created_at DESC;
    `;

    connection.query(sql, [videoID], (err, result) => {
        if (err) {
            console.error("Ошибка SQL при получении комментариев:", err);
            return res.status(500).json({ error: "Ошибка базы данных" });
        }   

        res.status(200).json({ comments: result, userID });
    });
});

app.post('/edit-comment', async(req, res)=>{
    const {updatedText, commentID} = req.body

    if(!updatedText || !updatedText){
        return res.status(400).json({ error: "Not found updatedText or commentID" });
    }

    connection.query('UPDATE comments SET content = ? WHERE id = ?', [updatedText, commentID], (err, result)=>{
        if(err){
            console.error("Ошибка SQL при удалении подписки:", err);
            return res.status(500).json({ error: "Ошибка базы данных", commentEdit: false });
        }

        res.status(200).json({commentEdit: true, message: "Comment successfully changed!"})
    })
})

app.post('/add-subcomment', async(req, res)=>{
    const { videoID, comment, commentID } = req.body
    const {userID} = req.cookies

    if(!userID){
        return res.json({ redirectUrl: '/authentication' })
    }else if(!videoID || !comment || !commentID){
        res.status(400).json({ message: "Not found: videoID or comment or commnetID" })
        return
    }

    try{
        console.log( videoID, comment, commentID)

        connection.query('INSERT INTO comments (user_id, parent_id, video_id, content) VALUES (?, ?, ?, ?)', [userID, commentID, videoID, comment], (err, result)=>{
            if(err){
                console.error("Ошибка SQL при удалении подписки:", err);
                return res.status(500).json({ error: "Ошибка базы данных", commentEdit: false });
            }
            const commentID = result.insertId;

            connection.query(`SELECT 
                comments.*,
                users.avatarImage,
                users.slug
                FROM comments
                JOIN users ON comments.user_id = users.id
                WHERE comments.id = ?
                `, [commentID],
                (err, rows) => {
                    if (err) {
                        console.error("Ошибка при получении комментария:", err);
                        return res.status(500).json({ error: "Ошибка при получении данных" });
                    }

                    return res.json({
                        message: "Комментарий успешно добавлен!",
                        subcomment: rows[0]
                    });
                });
        })

    }catch(err){
        console.log(err)
    }
})

app.get('/get-subcomment', async(req, res)=>{
    const {commentID} = req.query
    const { userID } = req.cookies;

    if (!commentID) {
        return res.status(400).json({ error: "Not found commentID or userID" });
    }

    const sql = `
        SELECT c.*, u.avatarImage, u.slug 
        FROM comments c 
        JOIN users u ON c.user_id = u.id 
        WHERE c.parent_id = ?
        ORDER BY c.created_at ASC;
    `;

    connection.query(sql, [commentID], (err, result)=>{
        if(err){
            console.error("Ошибка SQL при удалении подписки:", err);
            return res.status(500).json({ error: "Ошибка базы данных", commentEdit: false });
        }

        return res.json({
            message: "Подкомментарий успешно добавлен!",
            subcomments: result,
            userID
        })
    })
})
app.post('/comment-reaction', async (req, res) => {
    let { reactionType } = req.body;
    const { commentID, videoID } = req.body;
    const { userID } = req.cookies;

    if(!userID){
        return res.json({ redirectUrl: '/authentication' });
    }

    if (!commentID || !reactionType || !videoID) {
        return res.status(400).json({ error: "Не хватает параметров" });
    }

    const reactionValue = reactionType === 'like' ? 1 : 0;

    try {
        const [existingReaction] = await connection.promise().query(
            "SELECT like_status FROM comment_likes WHERE user_id = ? AND comment_id = ?",
            [userID, commentID]
        );

        let like_status, message;

        if (existingReaction.length > 0) {
            const currentLikeStatus = existingReaction[0].like_status;

            if (currentLikeStatus === reactionValue) {
                await connection.promise().query(
                    "DELETE FROM comment_likes WHERE user_id = ? AND comment_id = ?",
                    [userID, commentID]
                );
                message = "Реакция удалена";
                like_status = null;
            } else {
                await connection.promise().query(
                    "UPDATE comment_likes SET like_status = ? WHERE user_id = ? AND comment_id = ?",
                    [reactionValue, userID, commentID]
                );
                message = "Реакция обновлена";
                like_status = reactionValue;
            }
        } else {
            await connection.promise().query(
                "INSERT INTO comment_likes (user_id, comment_id, created_at, like_status, video_id) VALUES (?, ?, NOW(), ?, ?)",
                [userID, commentID, reactionValue, videoID]
            );
            message = "Лайк успешно добавлен";
            like_status = reactionValue;
        }

        const [likeCountResult] = await connection.promise().query(
            "SELECT COUNT(*) AS like_count FROM comment_likes WHERE comment_id = ? AND like_status = 1",
            [commentID]
        );

        const [dislikeCountResult] = await connection.promise().query(
            "SELECT COUNT(*) AS dislike_count FROM comment_likes WHERE comment_id = ? AND like_status = 0",
            [commentID]
        );
        return res.json({
            message: message,
            like_status: like_status,
            like_count: likeCountResult[0].like_count,
            dislike_count: dislikeCountResult[0].dislike_count
        });
    } catch (err) {
        console.error('Ошибка при обработке запроса:', err);
        return res.status(500).json({ error: "Ошибка сервера" });
    }
});

app.get('/get-likes-comments', async (req, res) => {
    const videoID = req.query.query;
    const { userID } = req.cookies;

    if (!videoID) {
        return res.status(400).json({ error: "Not found videoID" });
    }

    try {
        const queryTotalLikes = `
            SELECT comment_id, 
            COUNT(CASE WHEN like_status = 1 THEN 1 END) AS like_count, 
            COUNT(CASE WHEN like_status = 0 THEN 1 END) AS dislike_count
            FROM comment_likes
            WHERE video_id = ?
            GROUP BY comment_id
        `;
        
        const queryUserLikeStatus = "SELECT comment_id, like_status FROM comment_likes WHERE video_id = ? AND user_id = ?";

        connection.query(queryTotalLikes, [videoID], (err, totalLikesResult) => {
            if (err) {
                console.error("Ошибка SQL при получении общего количества лайков:", err);
                return res.status(500).json({ error: "Ошибка базы данных при получении лайков", likesFound: false });
            }

            if (!userID) {
                return res.json({
                    comment_likes: totalLikesResult,
                    user_like_status: null,
                });
            }

            connection.query(queryUserLikeStatus, [videoID, userID], (err, userLikesResult) => {
                if (err) {
                    console.error("Ошибка SQL при получении статуса лайка пользователя:", err);
                    return res.status(500).json({ error: "Ошибка базы данных при получении статуса лайка", likesFound: false });
                }

                const userLikesMap = userLikesResult.reduce((acc, row) => {
                    acc[row.comment_id] = row.like_status;
                    return acc;
                }, {});

                const commentsWithLikes = totalLikesResult.map((comment) => {
                    return {
                        comment_id: comment.comment_id,
                        like_count: comment.like_count,
                        dislike_count: comment.dislike_count,
                        like_status: userLikesMap[comment.comment_id] !== undefined ? userLikesMap[comment.comment_id] : null
                    };
                });

                res.status(200).json({ comment_likes: commentsWithLikes, message: "Лайки и дизлайки комментариев успешно найдены!" });
            });
        });

    } catch (err) {
        console.error("/get-likes-comments", err);
        return res.status(500).json({ error: "Ошибка сервера", likesFound: false });
    }
});

app.get('/get-user', async (req, res) => {
    const { userID, guestID } = req.cookies;

    const success = !!userID || !guestID;
    const message = userID ? "User found successfully" : guestID ? "The user is a guest" : "User not found";

    res.json({
        success: success,
        message: message
    });
});

app.get('/get-likes-subcomments', async (req, res) => {
    const parentCommentID = req.query.commentID; // ID основного комментария
    const { userID } = req.cookies;

    if (!parentCommentID) {
        return res.status(400).json({ error: "Не указан commentID" });
    }

    try {
        // Получаем ID всех подкомментариев
        const querySubcommentIDs = `
            SELECT id FROM comments WHERE parent_id = ?
        `;

        connection.query(querySubcommentIDs, [parentCommentID], (err, subcommentIDs) => {
            if (err) {
                console.error("Ошибка SQL при получении ID подкомментариев:", err);
                return res.status(500).json({ error: "Ошибка базы данных при получении ID подкомментариев" });
            }

            if (subcommentIDs.length === 0) {
                return res.json({ subcomment_likes: [], message: "Нет подкомментариев" });
            }

            const subcommentIDList = subcommentIDs.map(row => row.id); // Массив ID подкомментариев

            // Получаем лайки для найденных подкомментариев
            const queryTotalLikes = `
                SELECT comment_id, 
                COUNT(CASE WHEN like_status = 1 THEN 1 END) AS like_count, 
                COUNT(CASE WHEN like_status = 0 THEN 1 END) AS dislike_count
                FROM comment_likes
                WHERE comment_id IN (?)
                GROUP BY comment_id
            `;

            connection.query(queryTotalLikes, [subcommentIDList], (err, totalLikesResult) => {
                if (err) {
                    console.error("Ошибка SQL при получении лайков подкомментариев:", err);
                    return res.status(500).json({ error: "Ошибка базы данных при получении лайков подкомментариев" });
                }

                if (!userID) {
                    return res.json({ subcomment_likes: totalLikesResult, user_like_status: null });
                }

                // Получаем лайк-статус пользователя для этих подкомментариев
                const queryUserLikeStatus = `
                    SELECT comment_id, like_status 
                    FROM comment_likes 
                    WHERE comment_id IN (?) AND user_id = ?
                `;

                connection.query(queryUserLikeStatus, [subcommentIDList, userID], (err, userLikesResult) => {
                    if (err) {
                        console.error("Ошибка SQL при получении статуса лайков подкомментариев:", err);
                        return res.status(500).json({ error: "Ошибка базы данных при получении статуса лайков" });
                    }

                    // Преобразуем результат в удобный формат
                    const userLikesMap = userLikesResult.reduce((acc, row) => {
                        acc[row.comment_id] = row.like_status;
                        return acc;
                    }, {});

                    const subcommentsWithLikes = totalLikesResult.map(subcomment => ({
                        comment_id: subcomment.comment_id,
                        like_count: subcomment.like_count,
                        dislike_count: subcomment.dislike_count,
                        like_status: userLikesMap[subcomment.comment_id] !== undefined ? userLikesMap[subcomment.comment_id] : null
                    }));

                    res.status(200).json({
                        subcomment_likes: subcommentsWithLikes,
                        message: "Лайки подкомментариев успешно найдены!"
                    });
                });
            });
        });

    } catch (err) {
        console.error("/get-likes-subcomments", err);
        return res.status(500).json({ error: "Ошибка сервера" });
    }
});

app.get('/video-details/:videoID', (req, res) => {
    const { videoID } = req.params;

    if(!videoID){
        return res.status(400).json({ error: "Не указан videoID" });
    }

    const sql = `
        SELECT 
            v.id,
            v.title,
            v.uploaded_at,
            (SELECT COUNT(*) FROM views WHERE video_id = v.filename) AS views,
            (SELECT COUNT(*) FROM comments WHERE video_id = v.filename) AS comments,
            (SELECT COUNT(*) FROM likes_dislikes WHERE video_id = v.filename AND like_status = 1) AS likes
        FROM videos v
        WHERE v.filename = ?;
    `;

    connection.query(sql, [videoID], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Video not found' });
        }

        const video = results[0];

        const uploadedAt = new Date(video.uploaded_at);
        const now = new Date();
        const diffInDays = Math.floor((now - uploadedAt) / (1000 * 60 * 60 * 24));
        const timeAgo = diffInDays === 0 ? "Today" : `${diffInDays} days ago`;

        res.json({
            success: true,
            video: {
                id: video.id,
                title: video.title,
                uploaded: timeAgo,
                views: video.views,
                comments: video.comments,
                likes: video.likes
            }
        });
    });
});

app.get('/get-trends-video', async(req, res)=>{
    
})

app.get('/get-explore-video', async (req, res) => {
    const userID = req.cookies.userID || req.cookies.guestID;
    if (!userID) {
        return res.status(400).json({ error: "Нет userID!" });
    }

    try {
        connection.query('SELECT * FROM views WHERE user_id = ?', [userID], (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }

            if (result.length === 0) {
                return res.status(404).json({ success: false, message: "Нет просмотров" });
            }

            const filenames = result.map(row => row.video_id); 

            connection.query('SELECT * FROM videos WHERE filename IN (?)', [filenames], (err, videoResult) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ success: false, message: 'Database error' });
                }

                return res.status(200).json({ success: true, message: "Explore video", videos: videoResult });
            });
        });

    } catch (err) {
        console.error("/get-explore-video", err);
        return res.status(500).json({ error: "Ошибка сервера" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});