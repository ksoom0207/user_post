const express = require('express');
let router = express.Router({ mergeParams: true });
const mysqlCon = require('../../mysql');
const req = require('express/lib/request');

const commentquery = mysqlCon.init();

router.use(express.json());

let cmt = function (req, res) { }

//댓글 보이기
router.post('/', async (req, res) => {
    let idx = parseInt(req.params.idx);
    let select_query = `select user_id, content from comment_table where idx = ?`;

    commentquery.query(insert_query, idx, (err, result, fleid) => {
        if (err) { console.log(err); return res.sendStatus(400); }
        return res.sendStatus(200).send(result);
    })
});


router.post('/', (req, res) => {
    let insert_query = `insert into comment_table SET ?`;
    let idx = parseInt(req.params.idx);

    let comment = {
        "user_id": req.body.user_id,
        "content": req.body.content,
        "comment_depth": 0,
        "post_idx": idx
    }
    //user_id를 나중에는 세션 스토리지 통해 받아오기

    if (!comment.content) return res.status(400).send("write_content");
    if (!comment.user_id) return res.status(400).send("write_user_id");

    commentquery.query(insert_query, comment, (err, result, fleid) => {
        if (err) { console.log(err); return res.sendStatus(400); }
        return res.sendStatus(201);
    })
});

//대댓글을 위한 쿼리
router.post('/:comment_idx', (req, res) => {
    let idx = parseInt(req.params.idx);
    let comment_idx = parseInt(req.params.comment_idx);

    let comment = {
        "user_id": req.body.user_id,
        "content": req.body.content,
        "comment_depth": 1,
        "post_idx": idx,
        "comment_parent_idx": comment_idx
    }
    //실제로 db에 comment_idx가 존재하는지, 그게 부모인지 자식인지 조회하는 로직이 필요함! 22-01-29
    if (!comment.content) return res.status(400).send("write_content");
    if (!comment.user_id) return res.status(400).send("write_user_id");

    let insert_query = `insert into comment_table SET ?`;
    commentquery.query(insert_query, comment, (err, result, fleid) => {
        if (err) { console.log(err); return res.sendStatus(400); }
        return res.sendStatus(201);
    })
});
//TODO (마지막에하기)목록조회 

module.exports = router;
