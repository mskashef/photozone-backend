let mySql = require('mysql');
const config = require('./config.js');
const queries = require('./queries.js');

function getChatId(user1, user2) {
    for (let i = 0; i < Math.min(user1.length, user2.length); i++) {
        if (user1[i] === user2[i]) continue;
        if (user1.charCodeAt(i) > user2.charCodeAt(i)) return `${user2}:${user1}`;
        return `${user1}:${user2}`;
    }
    if (user1.length > user2.length) return `${user2}:${user1}`;
    if (user1.length < user2.length) return `${user1}:${user2}`;
    return null;
}

console.log(getChatId("photozone", "mskashef"));

const userExists = (username, existsCallback, notExistsCallback) => {
    const connection = mySql.createConnection(config);
    connection.connect();
    let query = queries.getUser(username);
    connection.query(query, (err, rows, fields) => {
        if (rows.length !== 0) existsCallback();
        else notExistsCallback();
    });
    connection.end();
};
const getUser = (username, callback) => {
    const connection = mySql.createConnection(config);
    connection.connect();
    let query = queries.getUser(username);
    connection.query(query, (err, rows, fields) => {
        if (rows.length !== 0) {
            callback(rows[0]);
            console.log(rows[0])
        }
    });
    connection.end();
};
const addSession = (username, uid, callback = () => {
}) => {
    const connection = mySql.createConnection(config);
    connection.connect();
    let query = queries.addSession(username, uid);
    connection.query(query, (err, rows, fields) => {
        callback();
    });
    connection.end();
};
const follow = (username, following, callback = () => {
}) => {
    const connection = mySql.createConnection(config);
    connection.connect();
    let query = queries.follow(username, following);
    console.log(query);
    connection.query(query, (err, rows, fields) => {
        if (!err) callback();
        console.log(err);
    });
    connection.end();
};
const savePost = (username, postId, callback = () => {
}, err = () => {
}) => {
    const connection = mySql.createConnection(config);
    connection.connect();
    let query = queries.savePost(username, postId);
    connection.query(query, (error, rows, fields) => {
        if (error) err(error);
        callback();
    });
    connection.end();
};
const addUser = (username, pass, name, bio, callback = () => {
}, err = () => {
}) => {
    const connection = mySql.createConnection(config);
    connection.connect();
    let query = queries.addUser(username, pass, name, bio);
    connection.query(query, (error, rows, fields) => {
        if (error) {
            err(error);
        } else {
            follow(username, username, callback);
        }
    });
    connection.end();
};

const getUsernameOfUid = (uid, callback = () => {
}, errCallback = () => {
}) => {
    const connection = mySql.createConnection(config);
    connection.connect();
    let query = queries.getUsernameOfUid(uid);
    connection.query(query, (err, rows, fields) => {
        if (rows && rows.length !== 0 && rows[0] && rows[0].username === username) {
            callback(rows[0].uid);
        } else errCallback();
    });
    connection.end();
};

const isValidUid = (username, uid, callback = () => {
}, errCallback = () => {
}) => {
    const connection = mySql.createConnection(config);
    connection.connect();
    let query = queries.getUsernameOfUid(uid);
    connection.query(query, (err, rows, fields) => {
        if (rows && rows.length !== 0 && rows[0] && rows[0].username === username) {
            callback();
        } else errCallback();
    });
    connection.end();
};
const addTagsToPost = (postId, tags, callback = () => {
}, err = () => {
}) => {
    const connection = mySql.createConnection(config);
    connection.connect();
    let query = queries.addTagsToPost(postId, tags);
    connection.query(query, (error, rows, fields) => {
        if (error) err(error);
        else callback();
    });
    connection.end();
};
const getUserInfo = (myUsername, username, callback = () => {
}, err = () => {
}) => {
    let userInfo = {};
    const connection = mySql.createConnection(config);
    connection.connect();
    connection.query(queries.getFollowersCount(username), (error, rows, fields) => {
        if (error) err(error);
        else {
            userInfo.followersCount = rows[0].n;
            connection.query(queries.getFollowingsCount(username), (error, rows, fields) => {
                if (error) {
                    err(error);
                } else {
                    userInfo.followingsCount = rows[0].n;
                    connection.query(queries.getPostsCount(username), (error, rows, fields) => {
                        if (error) err(error);
                        else {
                            userInfo.postsCount = rows[0].n;
                            connection.query(queries.getUserInfo(username), (error, rows, fields) => {
                                if (error) err(error);
                                else {
                                    userInfo.username = rows[0].username;
                                    userInfo.name = rows[0].name;
                                    userInfo.profPic = rows[0].profPic;
                                    userInfo.bio = rows[0].bio;
                                    connection.query(queries.amIFollowingUser(myUsername, username), (error, rows, fields) => {
                                        if (error) err(error);
                                        else {
                                            userInfo.amIFollowing = rows.length > 0;
                                            callback(userInfo);
                                            connection.end();
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });

};
const getPostsOfUser = (username, callback = () => {
}, err = () => {
}) => {
    const connection = mySql.createConnection(config);
    connection.connect();
    let query = queries.getPostsOfUser(username);
    console.log(query);
    connection.query(query, (error, rows, fields) => {
        if (error) err(error);
        else callback(rows);
    });
    connection.end();
};
const followOrUnfollow = (username, following, follow, callback = () => {
}, err = () => {
}) => {
    const connection = mySql.createConnection(config);
    connection.connect();
    let query = follow ? queries.follow(username, following) : queries.unfollow(username, following);
    console.log(query);
    connection.query(query, (error, rows, fields) => {
        if (error) err(error);
        else callback();
    });
    connection.end();
};
const addPost = (postId, publisher, title, caption, photo, tags, callback = () => {
}, err = () => {
}) => {
    const connection = mySql.createConnection(config);
    connection.connect();
    let query = queries.addPost(postId, publisher, title, caption, photo);
    connection.query(query, (error, rows, fields) => {
        if (error) err(error);
        else addTagsToPost(postId, tags, callback, error => {
            err(error)
        });
    });
    connection.end();
};
const getPosts = (username, callback = () => {
}) => {
    const connection = mySql.createConnection(config);
    connection.connect();
    let query = queries.getPosts(username);
    connection.query(query, (err, rows, fields) => {
        callback(rows);
    });
    connection.end();
};
const getSavedPosts = (username, callback = () => {
}) => {
    const connection = mySql.createConnection(config);
    connection.connect();
    let query = queries.getSavedPosts(username);
    console.log(query);
    connection.query(query, (err, rows, fields) => {
        callback(rows);
    });
    connection.end();
};
const getChats = (username, callback = () => {}, err = () => {}) => {
    const connection = mySql.createConnection(config);
    connection.connect();
    let query = queries.getChats(username);
    connection.query(query, (error, rows, fields) => {
        if (error || !rows || rows.length === 0) err(error);
        else {
            let chats = {};
            for (let i = 0; i < rows.length; i++) {
                const msg = rows[i];
                const contactUsername = msg.senderId === username ? msg.receiverId : msg.senderId;
                chats[msg.chatId] = {
                    content: msg.content,
                    hasNewMessage: msg.senderId === username ? false : !msg.seen,
                    contactUsername: contactUsername,
                    profPic: '/images/profPics/' + contactUsername,
                };
            }
            callback(Object.values(chats).reverse());
        }
    });
    connection.end();
};

const getMessages = (username, contactId, callback = () => {}, err = () => {}) => {
    const connection = mySql.createConnection(config);
    connection.connect();
    let query = queries.getMessages(username, contactId);
    connection.query(query, (error, rows, fields) => {
        if (error || !rows || rows.length === 0) err(error);
        else callback(rows);
    });
    connection.end();
};

const seenMessages = (username, contactId, callback = () => {}, err = () => {}) => {
    const connection = mySql.createConnection(config);
    connection.connect();
    let query = queries.seenMessages(username, contactId);
    console.log(query)
    connection.query(query, (error, rows, fields) => {
        if (error || !rows || rows.length === 0) err(error);
        else callback(rows);
    });
    connection.end();
};

const sendMessage = (username, content, to, callback = () => {}, err = () => {}) => {
    const connection = mySql.createConnection(config);
    connection.connect();
    let query = queries.sendMessage(username, content, to);
    console.log("TO" + to)
    connection.query(query, (error, rows, fields) => {
        if (error || !rows || rows.length === 0) err(error);
        else callback();
    });
    connection.end();
};

const getTagsOfPost = (postId, callback = () => {
}, err = () => {
}) => {
    const connection = mySql.createConnection(config);
    connection.connect();
    let query = queries.getTagsOfPost(postId);
    connection.query(query, (error, rows, fields) => {
        if (error || !rows || rows.length === 0) err(error);
        else callback(rows);
    });
    connection.end();
};
const getPost = (postId, callback = () => {
}, err = () => {
}) => {
    const connection = mySql.createConnection(config);
    connection.connect();
    let query = queries.getPost(postId);
    connection.query(query, (error, rows, fields) => {
        if (error || !rows || rows.length === 0) err(error);
        else {
            getTagsOfPost(postId, (tags) => {
                callback({postDetails: rows[0], ...{tags}});
            }, error => {
                err(error);
            });
        }
    });
    connection.end();
};
const searchPosts = (tags, callback = () => {
}, err = () => {
}) => {
    const connection = mySql.createConnection(config);
    connection.connect();
    let query = queries.searchPosts(tags);
    console.log(query);
    connection.query(query, (error, rows, fields) => {
        if (error) err(error);
        else callback(rows);
    });
    connection.end();
};
const searchUsers = (searchText, callback = () => {
}, err = () => {
}) => {
    const connection = mySql.createConnection(config);
    connection.connect();
    let query = queries.searchUsers(searchText);
    console.log(query);
    connection.query(query, (error, rows, fields) => {
        if (error) err(error);
        else callback(rows);
    });
    connection.end();
};
// console.log(getChatId("mskashef", "mskashee"));
exports.userExists = userExists;
exports.getUser = getUser;
exports.addSession = addSession;
exports.addUser = addUser;
exports.isValidUid = isValidUid;
exports.addPost = addPost;
exports.getPosts = getPosts;
exports.savePost = savePost;
exports.getPost = getPost;
exports.searchPosts = searchPosts;
exports.searchUsers = searchUsers;
exports.getUserInfo = getUserInfo;
exports.getPostsOfUser = getPostsOfUser;
exports.followOrUnfollow = followOrUnfollow;
exports.getSavedPosts = getSavedPosts;
exports.getChats = getChats;
exports.getChatId = getChatId;
exports.getMessages = getMessages;
exports.sendMessage = sendMessage;
exports.seenMessages = seenMessages;
