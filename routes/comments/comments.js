const express = require('express');
let router = express.Router({ mergeParams: true });
const mysqlCon = require('../../mysql');
const req = require('express/lib/request');

const commentquery = mysqlCon.init();

router.use(express.json());

let cmt = function (req, res) { }

//댓글 보이기
router.post('/', (req, res) => {
    let insert_query = `insert into comment_table SET ?`;
    let idx = parseInt(req.params.idx);

    let comment = {
        "user_id": req.body.user_id,
        "content": req.body.content,
        "comment_depth": 0,
        "post_idx": idx
    }

    commentquery.query(insert_query, comment, (err, result, fleid) => {
        if (err) { console.log(err); return res.sendStatus(400); }
        return res.sendStatus(201);
    })
});

//대댓글을 위한 쿼리
router.post('/:comment_idx', (req, res) => {
    let comment_idx = parseInt(req.params.idx);
    let insert_query = `insert into comment_table SET post_idx = ?, content = ?, user_id = ?, comment_parent_idx = ?`;
    commentquery.query(insert_query, [req.body, comment_idx], (err, result, fleid) => {
        if (err) { console.log(err); return res.sendStatus(400); }
        return res.sendStatus(201);
    })
});

module.exports = router;
