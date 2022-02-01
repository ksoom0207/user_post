// const express = require('express');
// let router = express.Router({ mergeParams: true });
// const crypto = require('crypto');
// router.use(express.json());
// const postquery = mysqlCon.init();


// const post = {
//     view: async (req, res) => {
//         try {
//             postquery.query('select idx, title, content, user_id, upload_time from board_table where delete_time is null order by idx asc',
//                 (err, result, field) => {
//                     if (err) { console.log(err); return res.sendStatus(400); }
//                     return res.status(200).send(result);
//                 });

//         } catch (error) {
//             return res.sendStatus(401);
//         }

//     },

//     write: async (req, res) => {
//         let newWrite = {
//             "title": req.body.title,
//             "content": req.body.content,
//             "user_id": req.body.user_id,  //req.session.id 세션에 저장된 id 갖고오기
//             "board_pass": req.body.board_pass
//         };

//         let board_password = newWrite.board_pass;
//         //게시글 입력 쿼리 보내기
//         if (!req.body.title) return res.status(400).send("write_title");
//         if (!req.body.content) return res.status(400).send("write_content");
//         if (!req.body.user_id) return res.status(400).send("write_id");

//         if (newWrite.board_pass) { //게시글 비밀번호가 있을 경우
//             let hashPassword = crypto.createHash("sha256").update(String(board_password)).digest("hex");
//             postquery.query(`INSERT INTO board_table SET title = '${newWrite.title}' , content ='${newWrite.content}', user_id ='${newWrite.user_id}', board_pass = '${hashPassword}'`,
//                 (err, result) => {
//                     if (err) { return res.sendStatus(400); }
//                     return res.sendStatus(201);
//                 });
//         }
//         else {
//             //게시글 비밀번호가 없을 경우
//             postquery.query('INSERT INTO board_table SET ?', newWrite, (err, row) => {
//                 if (err) { return res.sendStatus(400); }
//                 return res.sendStatus(201);
//             });
//         }
//     },

//     idx_view: async (req, res) => {

//         let password = req.body.password;

//         postquery.query('select idx, title, content, user_id, board_pass, upload_time, delete_time from board_table where idx = ?', parseInt(req.params.idx), (err, result, field) => {
//             if (err) res.status(400).send(err);
//             // 없는 인덱스 페이지를 불러올경우
//             if (!result[0]) return res.sendStatus(404);
//             // 삭제된 게시글을 불러올 경우
//             if (result[0].delete_time) return res.status(404).send("deleted_post");
//             //게시글의 패스워드가 있을 경우
//             if (result[0].board_pass) {
//                 let dbpassword = result[0].board_pass;
//                 if (password === dbpassword) return res.status(200).send(result[0]);
//                 else return res.status(401).send("wrong_password");
//             }
//             return res.status(200).send(result[0]);

//         })
//     },


//     modify: async (req, res) => {
//         let idx = parseInt(req.params.idx);

//         if (!req.body.title) return res.status(400).send("write_title");
//         if (!req.body.content) return res.status(400).send("write_content");

//         //비밀번호 추가 or 변경
//         //TODO board_pass 암호화해서 보내가
//         if (req.body.board_pass) {
//             let board_password = req.body.board_pass;
//             let hashPassword = crypto.createHash("sha256").update(board_password).digest("hex");
//             //수정한 내용과 시간을 같이 보내줌
//             //users(id, pw) VALUES(?, ?)
//             postquery.query(`UPDATE board_table SET title = '${req.body.title}', content = '${req.body.content}', board_pass = '${hashPassword}' , modify_time = current_timestamp() where idx = ?`
//                 , idx, (err, result) => {
//                     if (err) { console.log(err); return res.status(400); }
//                     return res.sendStatus(200);
//                 })
//         }
//         //패스워드가 없을 경우
//         postquery.query('UPDATE board_table SET title = ?, content = ?, modify_time = current_timestamp() where idx = ?'
//             , [req.body.title, req.body.content, idx], (err, result) => {
//                 if (err) { console.log(err); return res.sendStatus(400); }
//                 return res.sendStatus(200);
//             })

//     },

//     delete: async (req, res) => {
//         //삭제시간 넣기
//         let idx = parseInt(req.params.idx);
//         let board_password = req.body.board_pass;
//         let hashPassword = crypto.createHash("sha256").update(board_password).digest("hex");
//         //인덱스 페이지 있는지 판별
//         postquery.query('select idx, board_pass from board_table where idx = ?', idx,
//             (err, result) => {
//                 // 페이지가 없을경우
//                 if (!result[0]) return res.sendStatus(404);

//                 //if (result[0]) { //페이지가 있을경우
//                 //비밀번호가 맞거나... 아님 실제 비밀번호가 null 값인경우
//                 if (result[0].board_pass == hashPassword || !result[0].board_pass) {
//                     postquery.query('update board_table SET delete_time = current_timestamp() where idx = ?', idx,
//                         (err, result) => {
//                             if (err) { return res.status(401); }
//                             return res.sendStatus(204);
//                         });
//                 }

//                 //}
//             });


//     }



// }


// module.exports = post;