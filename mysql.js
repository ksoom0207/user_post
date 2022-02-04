//mysql 모듈화
require('dotenv').config();
const mysql = require('mysql2/promise');

const mysqlCon = {
    //연결 객체 생성
    init: () => {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PW,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME,
            //  connectionLimit: "100",
            multipleStatements: true
        });
        return pool;
    },
    // 연결
    open: async (pool) => {
        // getConnection 메서드의 동작이 만약에 비동기라면 그 함수 자체에 async를 선언해줘야합니다.
        await pool.getConnection(async conn => conn);
        try { console.log("DBconnect"); }

        catch { // connect 맞나?
            console.log("connect_fail", err);
            // con.beginTransaction(function (err) { if (err) throw err; };
        }
    },
    // 연결종료
    close: async (con) => {
        await con.end(err => {
            if (err) {
                console.log("종료 실패", err);
            } else {
                console.log("종료 성공");
            }
        })
    }
}

// 생성한 객체를 모듈화 하여 외부 파일에서 불러와 사용 할 수 있도록
module.exports = mysqlCon;

//https://surprisecomputer.tistory.com/31
//https://nodeman.tistory.com/9