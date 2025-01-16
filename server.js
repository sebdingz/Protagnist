const express = require('express');
const fs = require('fs');
const path = require('path');

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const app = express();
const PORT = 3000;
const USERS_FILE = path.join(__dirname, 'users.json');
const REVIEWS_FILE = path.join(__dirname, 'reviews.json'); // 评论数据文件
const LIKES_FILE = path.join(__dirname, 'likes.json'); 

let groups = require('./groups.json'); 
// 中间件：解析 JSON 请求体
app.use(express.json());

// 提供静态文件服务
app.use(express.static(path.join(__dirname)));

// 根路径：加载登录页面
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'connection.html'));
});
const groupsFilePath = 'groups.json';
if (fs.existsSync(groupsFilePath)) {
    const data = fs.readFileSync(groupsFilePath, 'utf-8');
    try {
        groups = JSON.parse(data);
        if (!Array.isArray(groups)) groups = [];
    } catch (err) {
        console.error("Error parsing groups.json:", err);
        groups = [];
    }
} else {
    fs.writeFileSync(groupsFilePath, JSON.stringify([]));
}


app.get('/reviews', (req, res) => {
    fs.readFile(REVIEWS_FILE, 'utf8', (err, data) => {
        if (err && err.code === 'ENOENT') {
            // 如果文件不存在，返回空数组
            return res.json({});
        } else if (err) {
            console.error('读取评论数据失败:', err);
            return res.status(500).json({ success: false, message: '读取评论数据失败' });
        }

        try {
            const reviews = JSON.parse(data);
            res.json(reviews); // 返回评论数据
        } catch (err) {
            console.error('解析评论数据失败:', err);
            res.status(500).json({ success: false, message: '解析评论数据失败' });
        }
    });
});

// 注册新用户
// 注册新用户
app.post('/register', upload.single('avatar'), (req, res) => {
    const { username, password } = req.body;
    const avatarPath = req.file.path; // 获取上传的文件路径

    if (!username || !password) {
        return res.json({ success: false, message: '用户名和密码不能为空' });
    }

    // 读取并更新用户数据
    fs.readFile(USERS_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error('读取用户数据失败:', err);
            return res.json({ success: false, message: '读取用户数据失败' });
        }

        let users = [];
        try {
            users = JSON.parse(data);
        } catch (err) {
            console.error('解析用户数据失败:', err);
            return res.json({ success: false, message: '解析用户数据失败' });
        }

        if (users.some(user => user.username === username)) {
            return res.json({ success: false, message: '用户名已存在' });
        }

        // 保存新用户
        users.push({ username, password, avatarPath });
        fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8', (err) => {
            if (err) {
                console.error('保存用户数据失败:', err);
                return res.json({ success: false, message: '保存用户数据失败' });
            }

            res.json({ success: true, message: '注册成功' });
        });
    });
});



// 提交评论
app.post('/submit-review', (req, res) => {
    const { username, movieTitle, year, reviewText, rating, posterPath } = req.body;

    if (!username || !movieTitle || !reviewText || !rating || !posterPath) {
        return res.status(400).json({ success: false, message: '数据不完整' });
    }

    fs.readFile(REVIEWS_FILE, 'utf8', (err, data) => {
        if (err && err.code !== 'ENOENT') {
            console.error('读取评论数据失败:', err);
            return res.json({ success: false, message: '读取评论数据失败' });
        }

        let reviews = [];
        try {
            reviews = data ? JSON.parse(data) : {};
        } catch (err) {
            console.error('解析评论数据失败:', err);
            return res.json({ success: false, message: '解析评论数据失败' });
        }

        // 如果该用户不存在评论记录，初始化为空数组
        if (!reviews[username]) {
            reviews[username] = [];
        }

        // 添加新的评论
        reviews[username].push({ movieTitle, year, reviewText, rating, posterPath });

        // 保存到文件
        fs.writeFile(REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf8', (err) => {
            if (err) {
                console.error('保存评论数据失败:', err);
                return res.json({ success: false, message: '保存评论数据失败' });
            }

            res.json({ success: true, message: '评论提交成功' });
        });
    });
});

app.post('/delete-review', (req, res) => {
    const { adminUsername, targetUsername, movieTitle } = req.body;

    if (!adminUsername || !targetUsername || !movieTitle) {
        return res.status(400).json({ success: false, message: 'Missing data.' });
    }

    // 检查adminUsername是否为管理员
    fs.readFile(USERS_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading users data:', err);
            return res.status(500).json({ success: false, message: 'Failed to load users.' });
        }

        let users = [];
        try {
            users = JSON.parse(data);
        } catch (err) {
            console.error('Error parsing users data:', err);
            return res.status(500).json({ success: false, message: 'Error processing data.' });
        }

        const adminUser = users.find(u => u.username === adminUsername);
        if (!adminUser || adminUser.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized.' });
        }

        // 是管理员，开始删除评论
        fs.readFile(REVIEWS_FILE, 'utf8', (err, reviewsData) => {
            if (err && err.code !== 'ENOENT') {
                console.error('Error reading reviews data:', err);
                return res.status(500).json({ success: false, message: 'Failed to read reviews.' });
            }

            let reviews = reviewsData ? JSON.parse(reviewsData) : {};
            if (!reviews[targetUsername]) {
                return res.status(404).json({ success: false, message: 'User has no reviews.' });
            }

            // 在targetUsername的评论列表中删除对应movieTitle的评论
            const originalLength = reviews[targetUsername].length;
            reviews[targetUsername] = reviews[targetUsername].filter(r => r.movieTitle !== movieTitle);

            if (reviews[targetUsername].length === originalLength) {
                // 没有找到此评论
                return res.status(404).json({ success: false, message: 'Review not found.' });
            }

            // 如果用户没有评论了，可以考虑删除空数组
            if (reviews[targetUsername].length === 0) {
                delete reviews[targetUsername];
            }

            fs.writeFile(REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf8', (err) => {
                if (err) {
                    console.error('Error saving reviews data:', err);
                    return res.status(500).json({ success: false, message: 'Failed to save changes.' });
                }

                res.json({ success: true, message: 'Review deleted successfully.' });
            });
        });
    });
});


app.post('/update-likes', (req, res) => {
    const { movieTitle, likes, action, username } = req.body;

    if (!movieTitle || likes === undefined || !action || !username) {
        return res.status(400).json({ success: false, message: "Invalid data" });
    }

    fs.readFile(LIKES_FILE, 'utf8', (err, data) => {
        let likeData = {};
        if (!err) {
            likeData = JSON.parse(data || "{}");
        }

        if (!likeData[movieTitle]) {
            likeData[movieTitle] = { likes: 0, users: [] };
        }

        const userList = likeData[movieTitle].users;

        if (action === "like") {
            if (!userList.includes(username)) {
                likeData[movieTitle].likes += 1;
                userList.push(username);
            }
        } else if (action === "unlike") {
            if (userList.includes(username)) {
                likeData[movieTitle].likes -= 1;
                likeData[movieTitle].users = userList.filter(user => user !== username);
            }
        }

        fs.writeFile(LIKES_FILE, JSON.stringify(likeData, null, 2), 'utf8', (err) => {
            if (err) {
                console.error("Error saving likes:", err);
                return res.status(500).json({ success: false, message: "Failed to save likes" });
            }
            res.json({ success: true, likes: likeData[movieTitle].likes });
        });
    });
});

app.post('/add-friend', (req, res) => {
    const { username, friendName } = req.body;

    if (!username || !friendName) {
        return res.status(400).json({ success: false, message: 'Missing username or friendName.' });
    }

    fs.readFile(USERS_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading users data:', err);
            return res.status(500).json({ success: false, message: 'Failed to load users.' });
        }

        try {
            const users = JSON.parse(data);

            const user = users.find(u => u.username === username);
            const friend = users.find(u => u.username === friendName);

            if (!user || !friend) {
                return res.status(404).json({ success: false, message: 'User or friend not found.' });
            }

            // 确保 friends 列表存在
            user.friends = user.friends || [];
            friend.friends = friend.friends || [];

            // 检查是否已经是好友
            const alreadyFriends = user.friends.includes(friendName);
            if (alreadyFriends) {
                return res.json({ success: false, message: 'Already friends.' });
            }

            // 添加好友关系（双向更新）
            user.friends.push(friendName);
            friend.friends.push(username);

            // 保存更新后的数据
            fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8', (err) => {
                if (err) {
                    console.error('Error saving user data:', err);
                    return res.status(500).json({ success: false, message: 'Failed to save friend.' });
                }
                res.json({ success: true, message: 'Friend added successfully!' });
            });
        } catch (err) {
            console.error('Error parsing users data:', err);
            res.status(500).json({ success: false, message: 'Error processing data.' });
        }
    });
});

app.post('/save-group', (req, res) => {
    const { groupName, members } = req.body;

    if (!groupName || !members || members.length === 0) {
        return res.status(400).json({ message: "Invalid group data" });
    }

    groups.push({ groupName, members });

    fs.writeFile('./groups.json', JSON.stringify(groups, null, 2), (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to save group" });
        }
        res.json({ success: true });
    });
});

app.post('/update-group', (req, res) => {
    const { groupName, movieTitle, posterPath, addedBy } = req.body;

    fs.readFile('groups.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading groups.json:', err);
            return res.status(500).json({ error: 'Failed to read groups data.' });
        }

        let groups = JSON.parse(data);
        const group = groups.find(g => g.groupName === groupName);
        if (!group) {
            return res.status(404).json({ error: 'Group not found.' });
        }

        if (!group.movies) group.movies = [];
        group.movies.push({
            title: movieTitle,
            posterPath: posterPath,
            addedBy: addedBy,
        });

        fs.writeFile('groups.json', JSON.stringify(groups, null, 2), (err) => {
            if (err) {
                console.error('Error updating groups.json:', err);
                return res.status(500).json({ error: 'Failed to update groups data.' });
            }

            // 返回更新后的组信息，并加上 success 字段
            res.status(200).json({ success: true, group });
        });
    });
});




app.get('/groups', (req, res) => {
    const { groupName } = req.query;
    fs.readFile('groups.json', 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading groups.json:", err);
            return res.status(500).json({ error: 'Failed to read groups data.' });
        }

        let currentGroups;
        try {
            currentGroups = JSON.parse(data);
        } catch (parseErr) {
            console.error("Error parsing groups.json:", parseErr);
            return res.status(500).json({ error: 'Failed to parse groups data.' });
        }

        if (groupName) {
            const group = currentGroups.find(g => g.groupName === groupName);
            if (group) {
                res.json(group);
            } else {
                res.status(404).json({ error: "Group not found" });
            }
        } else {
            res.json(currentGroups); 
        }
    });
});



// 获取所有点赞数
app.get('/likes', (req, res) => {
    fs.readFile(LIKES_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading likes:", err);
            return res.status(500).json({ success: false, message: "Failed to fetch likes" });
        }

        try {
            const likeData = JSON.parse(data || "{}");

            
            const formattedLikes = Object.keys(likeData).reduce((acc, movieTitle) => {
                acc[movieTitle] = {
                    likes: likeData[movieTitle].likes || 0,
                    users: likeData[movieTitle].users || []
                };
                return acc;
            }, {});

            res.json(formattedLikes);
        } catch (err) {
            console.error("Error parsing likes data:", err);
            res.status(500).json({ success: false, message: "Failed to parse likes data" });
        }
    });
});

app.get('/friends/:username', (req, res) => {
    const { username } = req.params;

    fs.readFile(USERS_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading user data:', err);
            return res.status(500).json({ success: false, message: 'Failed to load users.' });
        }

        try {
            const users = JSON.parse(data);
            const user = users.find(u => u.username === username);

            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

           
            const friends = (user.friends || []).map(friendName => 
                users.find(u => u.username === friendName)
            ).filter(Boolean); 
            res.json(friends);
        } catch (err) {
            console.error('Error parsing user data:', err);
            res.status(500).json({ success: false, message: 'Error processing data' });
        }
    });
});


app.get('/search-user', (req, res) => {
    const { query } = req.query;

    fs.readFile(USERS_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading user data:', err);
            return res.status(500).json({ success: false, message: 'Failed to load users.' });
        }

        try {
            const users = JSON.parse(data);
            const result = users.find(u => u.username.toLowerCase() === query.toLowerCase());

            if (result) {
                res.json(result);
            } else {
                res.status(404).json({ success: false, message: 'User not found' });
            }
        } catch (err) {
            console.error('Error parsing user data:', err);
            res.status(500).json({ success: false, message: 'Error processing data' });
        }
    });
});




app.listen(PORT, () => {
    console.log(`服务器正在运行：http://localhost:${PORT}`);
});
