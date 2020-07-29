function getChatId(user1, user2) {
    console.log(user1);
    console.log(user2);
    for (let i = 0; i < Math.min(user1.length, user2.length); i++) {
        if (user1[i] === user2[i]) continue;
        if (user1.charCodeAt(i) > user2.charCodeAt(i)) return `${user2}:${user1}`;
        return `${user1}:${user2}`;
    }
    if (user1.length > user2.length) return `${user2}:${user1}`;
    if (user1.length < user2.length) return `${user1}:${user2}`;
    return null;
}
module.exports = {
    addUser: (username, pass, name, bio) => `INSERT INTO users (username, pass, name, bio, prof_pic) VALUES ('${username}', '${pass}', '${name}', '${bio}', '/images/profpics/${username}')`,

    follow: (username, following) => `INSERT INTO follows (user_id, following_id) VALUES ('${username}', '${following}')`,
    unfollow: (username, following) => `DELETE FROM follows WHERE user_id = '${username}' and following_id = '${following}'`,

    block: (username, blocked) => `INSERT INTO blocks (user_id, blocked_id) VALUES ('${username}', '${blocked}')`,
    unblock: (username, blocked) => `DELETE FROM blocks WHERE user_id = '${username}' and blocked_id = '${blocked}'`,

    sendMessage: (username, content, to) => {
        return `
        INSERT INTO messages (sender_id, receiver_id, content, message_id, chat_id, sent_time)
        VALUES ('${username}', '${to}', '${content}', NULL, '${getChatId(username, to)}', current_timestamp())`;
    },

    getChats: (username) => `SELECT content, message_id AS messageId, sender_id AS senderId, receiver_id AS receiverId, sent_time AS sentTime, seen, chat_id AS chatId FROM messages WHERE sender_id='${username}' or receiver_id='${username}' ORDER BY sent_time `,
    getMessages: (username, contactId) => `SELECT * FROM messages WHERE chat_id='${getChatId(username, contactId)}'`,
    seenMessages: (username, contactId) => `UPDATE messages SET seen=1 WHERE sender_id='${contactId}' and receiver_id='${username}'`,

    addSession: (username, uid) => `INSERT INTO sessions (username, uid) VALUES ('${username}', '${uid}')`,
    getPosts: (username) => `SELECT tbl.post_id AS postId, tbl.publisher_id AS publisherId, tbl.title, tbl.caption, tbl.photo, tbl.publish_date, tbl.name AS publisherName, tbl.prof_pic AS publisherProfPic FROM (SELECT * FROM posts INNER JOIN users ON posts.publisher_id=users.username) tbl where publisher_id IN (SELECT following_id FROM follows where user_id='${username}') ORDER BY publish_date DESC`,
    searchPosts: (tags) => `SELECT DISTINCT tbl.post_id AS postId, tbl.publisher_id AS publisherId, tbl.title, tbl.caption, tbl.photo, tbl.publish_date, tbl.name AS publisherName, tbl.prof_pic AS publisherProfPic FROM (SELECT * FROM posts INNER JOIN users ON posts.publisher_id=users.username) tbl INNER JOIN post_has_hashtag ON tbl.post_id=post_has_hashtag.post_id where post_has_hashtag.hashtag IN (${tags.reduce ? (tags.reduce((total, tag) => total + `'${tag}',`, '')).slice(0, -1) : ''}) ORDER BY publish_date DESC`,
    getPost: (postId) => `SELECT tbl.post_id AS postId, tbl.publisher_id AS publisherId, tbl.title, tbl.caption, tbl.photo, tbl.publish_date, tbl.name AS publisherName, tbl.prof_pic AS publisherProfPic FROM (SELECT * FROM posts INNER JOIN users ON posts.publisher_id=users.username) tbl where post_id='${postId}'`,
    getTagsOfPost: (postId) => `SELECT hashtag FROM post_has_hashtag where post_id='${postId}'`,
    searchUsers: (searchText) => `SELECT name, username, prof_pic AS profpic FROM users WHERE username LIKE '%${searchText}%'`,

    addPost: (postId, publisher, title, caption, photo) => `INSERT INTO posts (post_id, publisher_id, caption, title, photo, publish_date) VALUES ('${postId}', '${publisher}', '${caption}', '${title}', '${photo}', current_timestamp())`,
    addTagsToPost: (postId, tags) => {
        let query = JSON.parse(tags).reduce((query, tag) => {
            return query + `('${postId}', '${tag}'),\n`
        }, 'INSERT INTO post_has_hashtag (post_id, hashtag) VALUES ');
        return query.slice(0, query.length - 2)
    },

    getUsernameOfUid: uid => `SELECT username from sessions WHERE uid = '${uid}'`,

    getFollowersCount: username => `SELECT COUNT(user_id) AS n FROM follows WHERE following_id='${username}'`,
    getFollowingsCount: username => `SELECT COUNT(following_id) AS n FROM follows WHERE user_id='${username}'`,
    getPostsCount: username => `SELECT COUNT(post_id) AS n FROM posts WHERE publisher_id='${username}'`,
    getUserInfo: username => `SELECT username, name, prof_pic AS profPic, bio FROM users WHERE username='${username}'`,
    getPostsOfUser: username => `SELECT post_id AS postId, photo FROM posts WHERE publisher_id='${username}' ORDER BY publish_date DESC`,
    getSavedPosts: username => `SELECT * FROM posts INNER JOIN saved_posts ON posts.post_id=saved_posts.post_id where user_id='${username}' ORDER BY save_date DESC`,
    amIFollowingUser: (myUsername, username) => `SELECT * FROM follows WHERE user_id='${myUsername}' and following_id='${username}'`,

    getUser: username => `SELECT * FROM users WHERE username = '${username}'`,

    savePost: (username, postId) => `INSERT INTO saved_posts (user_id, post_id, save_date) VALUES ('${username}', '${postId}', current_timestamp())`,
};
