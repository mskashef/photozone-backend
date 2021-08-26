const express = require('express');
const uuid = require('uuid');
const http = require('http');
const WebSocket = require('ws');
let mySql = require('mysql');
const app = express();
const config = require('./config.js');
const queries = require('./queries.js');
const cors = require('cors');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
var passwordHash = require('password-hash');
var session = require('express-session');
app.use(session({secret: 'keyboard cat', cookie: {maxAge: 365 * 24 * 60 * 60 * 1000}}));
const functions = require('./functions');
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const corsUrls = ['http://192.168.43.17:3000', 'http://192.168.43.17:5000', 'http://127.0.0.1:3000'];
app.use(cors({
    origin: (origin, cb) => cb(null, corsUrls.includes('*') || corsUrls.includes(origin)),
    credentials: true,
}));
app.use(fileUpload());
app.use(express.static('public'));

const redirectLogin2 = (req, res, next) => {

    console.log("-----------------------------");
    console.log(req.session.user);
    console.log("-----------------------------");

    if (!req.session || !req.session.user) {
        res.json({redirect: '/auth'});
    } else {
        console.log(req.session.user.username);
        console.log(req.session.user.uid);
        const connection = mySql.createConnection(config);
        connection.connect();
        functions.isValidUid(req.session.user.username, req.session.user.uid,
            () => {
                console.log("next---------");
                next()
            },
            () => {
                console.log("error---------");
                req.session.user = undefined;
                res.json({redirect: '/auth'}).end();
            }
        );
    }
};

const redirectLogin = (req, res, next) => {
    let username = req.header('username');
    let uid = req.header('token');
    if (!username || !uid) {
        res.json({redirect: '/auth'});
    } else {
        functions.isValidUid(username, uid, next, () => res.json({redirect: '/auth'}).end());
    }
};


app.use(bodyParser.json());                 // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

app.use(express.json());        // to support JSON-encoded bodies
app.use(express.urlencoded());  // to support URL-encoded bodies


app.get('/addUser', (req, res) => {
    res.cookie('cookieName', 'cookieValue');
    console.log(req.cookies);
    const connection = mySql.createConnection(config);
    connection.connect();
    console.log(req.query);
    connection.end();
    res.end();
});

app.post('/getPosts',redirectLogin,  (req, res) => {
    functions.getPosts(req.header('username'), rows => res.json(rows).end());
});

app.post('/getUserInfo', redirectLogin,  (req, res) => {
    functions.getUserInfo(req.header('username'), req.body.username, rows => {
        res.json(rows).end()
    }, err => {res.end()});
});

app.post('/followOrUnfollow', redirectLogin,  (req, res) => {
    functions.followOrUnfollow(req.header('username'), req.body.userId, req.body.follow, rows => {

        res.json(rows).end()
    }, err => {res.end()});
});


app.post('/getPostsOfUser',redirectLogin,  (req, res) => {
    functions.getPostsOfUser(req.body.username, rows => {
        console.log(rows);
        res.json(rows).end()
    }, err => {res.end()});
});

app.post('/getSavedPosts',redirectLogin,  (req, res) => {
    functions.getSavedPosts(req.header('username'), rows => {
        console.log(rows);
        res.json(rows).end()
    }, err => {res.end()});
});


app.post('/getPost', redirectLogin, async (req, res) => {
    functions.getPost(req.body.postId, post => {
        res.json({
            postId: post.postDetails.postId + "",
            publisherId: post.postDetails.publisherId,
            title: post.postDetails.title,
            photo: post.postDetails.photo,
            publisherName: post.postDetails.publisherName,
            publisherProfPic: post.postDetails.publisherProfPic,
            caption: post.postDetails.caption,
            tags: post.tags.map(item => item.hashtag)
        });
        console.log({
            postId: post.postDetails.postId + "",
            publisherId: post.postDetails.publisherId,
            title: post.postDetails.title,
            photo: post.postDetails.photo,
            publisherName: post.postDetails.publisherName,
            publisherProfPic: post.postDetails.publisherProfPic,
            caption: post.postDetails.caption,
            tags: post.tags.map(item => item.hashtag)
        })
        res.end();
    });
});

app.post('/searchInPosts', redirectLogin, async (req, res) => {
    const searchedTags = req.body.tags;
    functions.searchPosts(searchedTags, rows => {
        res.json(rows).end();
    }, err => {
        res.json({msg: "Sorry an error occurred while searching."})
    });
});

app.post('/searchInUsers', redirectLogin, async (req, res) => {
    const searchText = req.body.searchText;
    functions.searchUsers(searchText, rows => {
        res.json(rows).end();
    }, err => {
        res.status(500).json({msg: "Sorry an error occurred while searching."})
    });
});

app.get('/b', (req, res) => {
    app.use(express.static('2'));
    res.sendStatus(200);
});

app.post('/publishNewPost', redirectLogin, async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({msg: 'No files were uploaded.'});
    }

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let photo = req.files.photo;
    let imageFormat = '.' + photo.name.split('.')[photo.name.split('.').length - 1];
    imageFormat = imageFormat.trim() ? imageFormat.trim() : '.jpg';
    const id = req.header('username') + "-" + new Date().getTime() + "-" + photo.md5;
    let imageName = id + imageFormat;
    console.log(imageName);

    // Use the mv() method to place the file somewhere on your server
    photo.mv(`${__dirname}/public/images/posts/${imageName}`, (err) => {
        if (err) {
            res.status(500).send(err);
            return;
        }

        functions.addPost(id, req.header('username'), req.body.title, req.body.caption, `/images/posts/${imageName}`, req.body.tags, () => {
            res.sendStatus(200);
        }, (err) => {
            res.status(500).json({msg: "Sorry, A problem occurred!"});
        });
    });
    // const formData = req.body;
    // console.log('form data', formData);
    // res.sendStatus(200);
});

app.post('/updateProfilePicture', redirectLogin, async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({msg: 'No files were uploaded.'});
    }

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let photo = req.files.photo;
    let imageName = req.header('username');
    console.log(imageName);

    // Use the mv() method to place the file somewhere on your server
    photo.mv(`${__dirname}/public/images/profpics/${imageName}`, (err) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
        console.log(`/public/images/profpics/${imageName}`);
        console.log("SUCCESS");
        res.end();
        // functions.addPost(id, req.header('username'), req.body.title, req.body.caption, `/images/posts/${imageName}`, req.body.tags, () => {
        //     res.sendStatus(200);
        // }, (err) => {
        //     res.status(500).json({msg: "Sorry, A problem occurred!"});
        // });
    });
    // const formData = req.body;
    // console.log('form data', formData);
    // res.sendStatus(200);
});

const authTypes = {
    signIn: 1,
    signUp: 2
};

app.post('/savePost', redirectLogin, async (req, res) => {
    functions.savePost(req.header('username'), req.body.postId, () => {
        res.end();
    }, () => {
        res.status(500).json({msg: 'You have previously saved this post.'}).end();
    });
});

app.post('/getChats', redirectLogin, async (req, res) => {
    functions.getChats(req.header('username'), rows => {
        res.json(rows);
    }, () => {
        res.json([]);
        // res.status(500).json({msg: 'Sorry. There was a problem with loading your chats.\nPlease Refresh the page or Log out and login again to solve the problem'}).end();
    });
});

app.post('/sendMessage', redirectLogin, async (req, res) => {
    functions.sendMessage(req.header('username'), req.body.content, req.body.to, rows => {
        res.json(rows);
    }, () => {
        res.status(500).json({msg: 'Sorry. There was a problem with sending your message.\nPlease Refresh the page or Log out and login again to solve the problem'}).end();
    });
});


app.post('/getMessages', redirectLogin, async (req, res) => {
    functions.getUser(req.body.contactId, user => {
        functions.getMessages(req.header('username'), req.body.contactId, rows => {
            res.json({
                messages: rows,
                contact: {
                    username: user.username,
                    name: user.name,
                    profPic: user.prof_pic
                }
            });
            functions.seenMessages(req.header('username'), req.body.contactId, () => {}, () => {});
        }, () => {
            // res.status(500).json({msg: 'Sorry. There was a problem with loading your Messages. Please Refresh the page or Log out and login again to solve the problem'}).end();
            res.json({
                messages: [],
                contact: {
                    username: user.username,
                    name: user.name,
                    profPic: user.prof_pic
                }
            });
        });
    })

});



app.post('/auth', async (req, res) => {
    const type = req.body.type;
    const userData = req.body;
    const uid = uuid.v4();
    const connection = mySql.createConnection(config);
    connection.connect();
    if (type === authTypes.signUp) { // sign up
        functions.userExists(userData.username, () => {
            res.status(500).json({msg: "Sorry, This username is not available!\nPlease choose another username."});
            res.end();
        }, () => {
            functions.addUser(userData.username, passwordHash.generate(userData.password), userData.name, '', ()=> {
                functions.addSession(userData.username, uid, () => {
                    res.status(200).json({token: uid, username: userData.username});
                    res.end();
                });
            }, (err) => {
                res.status(500).json({msg: "Sorry, This username already exists.\nPlease choose another username."});
                res.end();
            });
        });
    } else if (type === authTypes.signIn) { // sign in
        functions.userExists(userData.username, () => {
            // let realPass = functions.getUser(userData.username).pass;
            functions.getUser(userData.username, user => {
                let passIsOK = passwordHash.verify(userData.password, user.pass);
                if (passIsOK) {
                    functions.addSession(userData.username, uid, () => {
                        res.status(200).json({token: uid, username: userData.username});
                        res.end();
                    });
                } else {
                    res.status(500).json({msg: "Oops, Please re-type your username and password!"});
                    res.end();
                }
            });
        }, () => {
            res.status(500).json({msg: "Sorry, This username is not available."});
            res.end();
        });
    } else {
        res.status(500).json({msg: "What the faz ?? :|\n You didn't send the authType :|"});
    }
});


//initialize a simple http server
const server = http.createServer(app);

//start our server
server.listen(process.env.PORT || 8999, () => {
    console.log(`Server started on port ${server.address().port} :)`);
});



