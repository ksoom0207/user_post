const express = require('express');
let router = express.Router({ mergeParams: true });

const session = require('express-session');
var MySQLStore = require("express-mysql-session")(session);
const mysqlCon = require('../mysql');
const logger = require('morgan');

const commentroute = require('./comments/comments');
const crypto = require('crypto');

router.use(express.json());

const postquery = mysqlCon.init();

// var sessionStore = new MySQLStore(options);
// router.use(
//     session({
//         key: "session_cookie_name",
//         secret: "session_cookie_secret",
//         store: sessionStore,
//         resave: false,
//         saveUninitialized: false,
//     })
// );

//if로그인이 안되어 있으면 res.redirect(./login);
// function loginReq(req, res, next){ //     if(로그인되어){next();}  else(res.redirect('./login');) }

//저장 되어 있는 게시글 불러오기 
router.get('/', (req, res, next) => {
    try { //delete_time이 없는 즉, 삭제되지 않은 게시글 리스트를 보여줌
        postquery.query('select idx, title, content, user_id, upload_time, view_post from board_table where delete_time is null order by idx asc',
            (err, result, field) => {
                if (err) { console.log(err); return res.sendStatus(400); }
                let title_text = [];
                let title_text_modify = [];
                let view = 999;
                for (let i = 0; i < result.length; i++) {
                    title_text[i] = result[i].title;

                    if (title_text[i].length >= 50) {
                        title_text_modify = title_text[i].substring(0, 50);
                        result[i].title = title_text_modify + `...`;
                    }

                    if (result[i].view_post < 1000) {
                        view = view + '+';
                    }
                }

                return res.status(200).send(result);
            });

    } catch (error) {
        return res.sendStatus(401);
    }
});
//TODO 제목 길어질 경우 n글자 이상 되었을떄 처리하는 방법? / 작성일
//조회수 일정 범위 이상 넘어갈경우 +? 1K? 등등

router.post('/write', (req, res) => {
    let new_write = {
        "title": req.body.title,
        "content": req.body.content,
        "user_id": req.body.user_id,  //req.session.id 세션에 저장된 id 갖고오기
        "board_pass": req.body.board_pass
    };

    let insert_query = `INSERT INTO board_table SET title = ? , content = ?, user_id = ?, board_pass = ?`;

    let board_password = newWrite.board_pass;
    //게시글 입력 쿼리 보내기
    if (!new_write.title) return res.status(400).send("write_title");
    if (!new_write.content) return res.status(400).send("write_content");
    if (!new_write.user_id) return res.status(400).send("write_id");

    if (newWrite.board_pass) { //게시글 비밀번호가 있을 경우
        let hashPassword = crypto.createHash("sha256").update(String(board_password)).digest("hex");
        new_write.board_pass = hashPassword;
        postquery.query(insert_query, new_write, (err, result) => {
            if (err) { return res.sendStatus(400); }
            return res.sendStatus(201);
        });

    }
    else {
        //게시글 비밀번호가 없을 경우
        postquery.query('INSERT INTO board_table SET ?', newWrite, (err, row) => {
            if (err) { return res.sendStatus(400); }
            return res.sendStatus(201);
        });
    }

});
//TODO 텍스트 에디터? 기본HTML태그 뺴기

//게시글 보기
router.get('/:idx', (req, res) => {
    //idx의 번호를 가진 게시글을 보여줌 
    let password = req.body.password;
    let idx = parseInt(req.params.idx);
    let update_query = 'update board_table set view_post = view_post + 1 where idx = ?;';
    let select_query = 'select idx, title, content, user_id, board_pass, upload_time, delete_time from board_table where idx = ?;';
    let update = postquery.format(update_query, idx);
    let select = postquery.format(select_query, idx);

    postquery.query(select + update, (err, result, field) => {
        if (err) { console.log(err); res.status(400) };
        // 없는 인덱스 페이지를 불러올경우
        if (!result[0]) return res.sendStatus(404);
        // 삭제된 게시글을 불러올 경우
        if (result[0].delete_time) return res.status(404).send("deleted_post");
        //게시글의 패스워드가 있을 경우
        if (result[0].board_pass) {
            let dbpassword = result[0].board_pass;
            if (password === dbpassword) return res.status(200).send(result[0]);
            else return res.status(401).send("wrong_password");
        }
        return res.status(200).send(result[0]);
        // board_pass 값 안보이도록
    });
});
//삭제된 게시글이면 보여주지 않도록 처리해야 함 220129

//댓글 => 게시글 삭제가 되면 댓글도 삭제되도록 구현해야함
router.use('/:idx/comment', commentroute); //임시로 url


//수정하기 버튼을 눌렀을 경우
router.put('/:idx', (req, res) => {
    let idx = parseInt(req.params.idx);

    if (!req.body.title) return res.status(400).send("write_title");
    if (!req.body.content) return res.status(400).send("write_content");

    //비밀번호 추가 or 변경 
    //TODO board_pass 암호화해서 보내가
    if (req.body.board_pass) {
        let board_password = req.body.board_pass;
        let hashPassword = crypto.createHash("sha256").update(board_password).digest("hex");
        //수정한 내용과 시간을 같이 보내줌
        //users(id, pw) VALUES(?, ?)
        postquery.query(`UPDATE board_table SET title = '${req.body.title}', content = '${req.body.content}', board_pass = '${hashPassword}' , modify_time = current_timestamp() where idx = ?`
            , idx, (err, result) => {
                if (err) { console.log(err); return res.status(400); }
                return res.sendStatus(200);
            })
    }
    //패스워드가 없을 경우
    postquery.query('UPDATE board_table SET title = ?, content = ?, modify_time = current_timestamp() where idx = ?'
        , [req.body.title, req.body.content, idx], (err, result) => {
            if (err) { console.log(err); return res.sendStatus(400); }
            return res.sendStatus(200);
        })
});

//삭제
router.delete('/:idx', (req, res) => {
    //삭제시간 넣기
    let idx = parseInt(req.params.idx);
    let board_password = req.body.board_pass;
    let hashPassword = crypto.createHash("sha256").update(board_password).digest("hex");
    //인덱스 페이지 있는지 판별
    postquery.query('select idx, board_pass from board_table where idx = ?', idx,
        (err, result) => {
            // 페이지가 없을경우
            if (!result[0]) return res.sendStatus(404);

            //if (result[0]) { //페이지가 있을경우
            //비밀번호가 맞거나... 아님 실제 비밀번호가 null 값인경우
            if (result[0].board_pass == hashPassword || !result[0].board_pass) {
                postquery.query('update board_table SET delete_time = current_timestamp() where idx = ?', idx,
                    (err, result) => {
                        if (err) { return res.status(401); }
                        return res.sendStatus(204);
                    });
            }

            //}
        });


});

//검색기능 구현하기 22-01-29 => querystring으로 보낸다면? post/2/commnet?user_id=ksoom0207 이렇게
//

module.exports = router;
