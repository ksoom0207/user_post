let user_id = [];

user_id.push = /admin' OR '1'='1/;
user_id.push = /1='1/;

module.exports = function sql_protect(text) {
    for (let i = 0; i < user_id.length; i++) {
        if (user_id[i].test(text)) return false
    }
    return true;
}
// const sql_protect = {
//     user_id1: /admin' OR '1'='1/,
//     user_id2: /1='1/
// }

// const user_id1 = /admin' OR '1'='1/
// const user_id2 = /1='1/

// module.exports = sql_protect(text);¡