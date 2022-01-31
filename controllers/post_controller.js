const express = require('express');
let router = express.Router({ mergeParams: true });


const post = {
    view: async (req, res) => {
        try {
            postquery.query('select idx, title, content, user_id, upload_time from board_table where delete_time is null order by idx asc',
                (err, result, field) => {
                    if (err) { console.log(err); return res.sendStatus(400); }
                    return res.status(200).send(result);
                });

        } catch (error) {
            return res.sendStatus(401);
        }

    },

    write: async (req, res) => {
        let newWrite = {
            "title": req.body.title,
            "content": req.body.content,
            "user_id": req.body.user_id,  //req.session.id 세션에 저장된 id 갖고오기
            "board_pass": req.body.board_pass
        };

        let board_password = newWrite.board_pass;
        //게시글 입력 쿼리 보내기
        if (!req.body.title) return res.status(400).send("write_title");
        if (!req.body.content) return res.status(400).send("write_content");
        if (!req.body.user_id) return res.status(400).send("write_id");

        if (newWrite.board_pass) { //게시글 비밀번호가 있을 경우
            let hashPassword = crypto.createHash("sha256").update(String(board_password)).digest("hex");
            postquery.query(`INSERT INTO board_table SET title = '${newWrite.title}' , content ='${newWrite.content}', user_id ='${newWrite.user_id}', board_pass = '${hashPassword}'`,
                (err, result) => {
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
    }

}

module.exports = post;