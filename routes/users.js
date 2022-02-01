
const express = require('express');
let router = express.Router();
const session = require('express-session');
var MySQLStore = require("express-mysql-session")(session);

const mysqlCon = require('../mysql');
const memberquery = mysqlCon.init();
mysqlCon.open(memberquery);

const crypto = require('crypto');
const { route } = require("./post");

const texttest = require("../texttest");
const sql_protect = require("../sqlprotect");


//var sessionStore = new MySQLStore(options);
// router.use(
//     session({
//         key: "session_cookie_name",
//         secret: "session_cookie_secret",
//         store: sessionStore,
//         resave: false,
//         saveUninitialized: false,
//     })
// );
//웹 세션은 사용자가 애플리케이션(즉 웹이나 서버)와 상호 작용하는 동안에만 사용할 수 있도록 임시 데이터를 저장하기 위해 사용하는 데이터 형태

//정보를 입력하고 회원가입 하기 버튼(가상)을 눌렀을 경우

//TODO SQL injection 공부 => 미들웨어로 적용
router.post('/signup', (req, res) => {
    let body = req.body;
    let inputPassword = body.password;

    if (!req.body.id) return res.status(401).send("write_id");
    if (!req.body.name) return res.status(401).send("write_name");
    if (!req.body.password) return res.status(401).send("write_password");
    if (!req.body.email) return res.status(401).send("write_email");
    if (!req.body.phone_num) return res.status(401).send("write_phone_num");
    console.log(sql_protect(body.id));

    if (!sql_protect(req.body.id)) return res.status(401).send("cannot_use");

    if (!texttest.password.test(inputPassword)) return res.status(401).send("incorrect_password"); //정규표현식 통과못했다는걸 표시
    if (!texttest.email.test(req.body.email)) return res.status(401).send("incorrect_email"); //정규표현식 통과못했다는걸 표시
    if (!texttest.id.test(req.body.id)) return res.status(401).send("incorrect_id");
    if (!texttest.phone_num.test(req.body.phone_num)) return res.status(401).send("incorrect_phone_num");

    //비밀번호 암호화
    let salt = Math.round((new Date().valueOf() * Math.random())) + "";
    let hashPassword = crypto.createHash("sha512").update(inputPassword + salt).digest("hex");

    //입력해야 하는 필수요소들 중 하나라도 빠졌을 경우

    //조건을 만족할 경우
    //중복인 id 비교하기
    //TODO SQL 공부 SQL에서 아래 기능을 하는게 있는지?
    memberquery.query('select id, phone_num from member_table', (err, result) => {
        if (err) { return res.status(400); }
        for (const item of result) {
            if (item.id == body.id) return res.status(401).send("duplicated_id");
            if (item.phone_num == body.phone_num) return res.status(401).send("duplicated_phone_num");
        }
        return;
    });

    let query = `INSERT INTO member_table SET (id , password , name , email, phone_num , salt) VALUES(?,?,?,?,?,?);`
    let params = [body.id, hashPassword, body.name, body.email, body.phone_num, salt]
    memberquery.query(query, params, (err, row) => {
        if (err) { return res.status(400); }
        else return res.sendStatus(201);
    })

});


//로그인 정보 
router.post('/login', (req, res) => {
    let id = req.body.id;
    let password = req.body.password;
    //sql문 방지
    if (sql_protect(req.body.id)) return res.status(401).send("cannot_use");
    // if (sql_injection.user_id1.test(req.body.id)) return res.status(401).send("cannot_use");
    // if (sql_injection.user_id2.test(req.body.id)) return res.status(401).send("cannot_use");

    memberquery.query('select * from member_table where id = ?', [id], (err, result, fiedls) => {
        if (err) { return res.sendStatus(400); }
        //맞는 id가 없으면 다시 입력하기
        if (!result[0]) return res.status(404).send('check_id_or_pass');
        if (user.unsign_time) return res.status(401).send('cannot_use_this_id');

        //값이 존재할 경우

        let user = result[0];
        let dbpassword = user.password;
        let dbsalt = user.salt;
        let hashPassword = crypto.createHash("sha512").update(password + dbsalt).digest("hex");

        if (dbpassword === hashPassword) { // 비밀번호 일치여부 
            return res.status(200).send(user.idx + " " + user.name);
            //로그인 정보 유지
        } else return res.status(401).send('check_id_or_pass');
        // } else return res.sendStatus(400);
        //존재하지 않은경우 return 
        //TODO 0129 암호화 종류 / 암호화 미들웨어?
    })
});

//회원정보랑 비밀번호 수정 분기를 따로 두도록 수정하기 22-01-29
//회원번호를 안보이게 하는 방법은??
router.put('/:idx/info', (req, res) => {
    let body = {
        "email": req.body.email,
        "phone_num": req.body.phone_num
    }
    // if (!texttest.email.test(body.email)) return res.status(401).send("wrong_information_email");
    // if (!texttest.phone_num.test(body.phone_num)) return res.status(401).send("wrong_information_phone_num");

    //email을 수정할 경우
    // if (body.email) {
    //     memberquery.query('select phone_num from member_table', (err, result) => {
    //         if (err) { return res.status(400); }
    //         
    //         for (const item of result) {
    //             if (item.email == body.email) return res.status(401).send("duplicated_email");
    //         }
    //     });
    // }

});
router.put('/:idx/password', (req, res) => {
    let body = req.body;
    let password = body.password;
    let modify_password = body.newpassword;
    let idx = parseInt(req.params.idx);
    let salt;
    let NewhashPassword;
    //현재 비밀번호가 맞는지 확인은 어떻게 하지?
    if (!texttest.password.test(modify_password)) return res.status(401).send("write_other_newpassword"); //send 표현 수정


    //비밀번호를 수정할 경우
    memberquery.query('select password, salt from member_table where idx = ?', idx, (err, result, fiedls) => {
        if (err) { return res.sendStatus(400); }
        if (!result[0]) return res.sendStatus(404);
        let user = result[0];
        let dbpassword = user.password;
        let dbsalt = user.salt;
        let hashPassword = crypto.createHash("sha512").update(password + dbsalt).digest("hex");

        //값이 존재할 경우
        if (result.length > 0) { //바꾸기
            if (dbpassword === hashPassword) { // 비밀번호 일치여부 
                salt = Math.round((new Date().valueOf() * Math.random())) + "";
                New_hashPassword = crypto.createHash("sha512").update(modify_password + salt).digest("hex");
            } else return res.status(401).send('check_orizinal_password');

            memberquery.query(`UPDATE member_table SET password = '${New_hashPassword}', salt = '${salt}', modify_time = current_timestamp() where idx = ${idx}`,
                (err, result) => {
                    if (err) { console.log(err); return res.status(400); };
                    return res.sendStatus(200);
                })
        } return res.sendStatus(400);
    });
});

//로그아웃
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.sendStatus(500);
    })
    return res.sendStatus(200);
})

//회원탈퇴
router.delete('/:idx', (req, res) => {
    let idx = parseInt(req.params.idx);
    //TODO 값이 있는지 없는지 체크 
    if (idx == null) return res.status(400).send("incorrect_request");

    memberquery.query('select idx, isResign from member_table where idx = ?', idx,
        (err, result) => {
            //없는 id를 불러왔을경우
            if (!result[0]) { return res.status(404); }
            //이미 삭제된 id 일경우
            if (result[0].resign_time) { return res.status(401).send("deleted_id"); }
            //id 삭제 시간과 상태를 보내줌
            if (!result[0].resign_time) {
                memberquery.query('UPDATE member_table set resign_time = current_timestamp() where idx = ?', [idx], (err, result, fiedls) => {
                    if (err) { console.log(err); return res.status(400); }
                    return res.sendStatus(204);
                });
            }

        }
    )
});

// 회원 상세페이지, 아이디 찾기, 비밀번호 찾기 => 수정 로직 구현해야함 220129
// 비밀번호의 경우 본인 인증하고 새로 만드는게 더 편할수도? 
module.exports = router;


// 비즈니스 로직, route 컨트롤러 모델(개념), route와 controller 나누기, content 보안정책 => express 미들웨어 적용하기
// DATABASE 정규화(공부), PK, FK, Tranjection ACID

// 콜백지옥????
//TODO mysql 쿼리 보내는걸 callback을 promise나 await / async로 바꾸기
// mysql 비동기 callback구현?
//https://techlog.io/Javascript/General/%EC%9E%90%EB%B0%94%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8-%EB%B9%84%EB%8F%99%EA%B8%B0%ED%86%B5%EC%8B%A0-callback-promise-async-await-%EC%9D%B4%ED%95%B4%ED%95%98%EA%B8%B0/