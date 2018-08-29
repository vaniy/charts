
var mongoClient = require('mongodb').MongoClient;
var mogoUrl = 'mongodb://localhost:27017/ask';
// var BSON = require('bson');
var viewHandler = require('./viewHandler');
var team = require('../lib/team');
var xlsx = require('node-xlsx').default;
var fs = require('fs');

var createUsersFromXlsx = function (req, res, users) {
    mongoClient.connect(mogoUrl, function (err, db) {
        users.forEach((child, index) => {
            if (child && child.length > 0) {
                db.collection('user').find({ "email": { $regex: child.trim(), $options: "$i" } }).toArray(function (err, doc) {
                    if (err) {
                        // res.send({ status: 'failed', msg: '服务器错误稍后重试' });
                        if (index === users.length - 1) {
                            res.send({ status: 'success', msg: '成功添加' });
                            db.close();
                        }
                        // db.close();
                    } else if (!doc || doc.length == 0) {
                        db.collection('user').insertOne({
                            "email": child.trim(),
                            "createTime": new Date(),
                            "type": 'fromXlsx'
                        }, function () {
                            // res.send({ status: 'success', msg: '成功添加' });
                            if (index === users.length - 1) {
                                res.send({ status: 'success', msg: '成功添加' });
                                db.close();
                            }
                        })
                        // res.send({ status: 'failed', msg: '邮箱没权限，请联系管理员' });
                        // db.close();

                    } else {
                        if (index === users.length - 1) {
                            res.send({ status: 'success', msg: '成功添加' });
                            db.close();
                        }
                        // res.send({ status: 'failed', msg: '已存在' });
                        // db.close();
                    }
                });
            }
        });
    });
}

var updateUserEmail = function (req, res, users) {
    mongoClient.connect(mogoUrl, function (err, db) {
        users.forEach((child, index) => {
            db.collection('user').updateOne({ "email": { $regex: `^${child.email}`, $options: "$i" } }, {
                $set: {
                    "team": child.team
                }
            }, function () {
                if (index === users.length - 1) {
                    res.send({ status: 'success', msg: '成功修改' });
                    db.close();
                }
            });
        });
    })
}

var createScoreXlsx = function (req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('user').find({}).sort({ emial: 1 }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed', msg: '服务器错误稍后重试' });
                db.close();
            } else if (!doc || doc.length == 0) {
                res.send({ status: 'failed', msg: '服务器错误稍后重试' });
                db.close();

            } else {
                // callBack && callBack();
                let data = [];
                let info = ['邮箱', '姓名', '团队', '发现技能得分', '组织或团队创新者基因得分',
                    '第一题', '第二题', '第三题', '第四题', '第五题', '第六题', '第七题', '第八题', '第九题', '第十题',
                    '第十一题', '第十二题', '第十三题', '第十四题', '第十五题', '第十六题', '第十七题', '第十八题', '第十九题', '第二十题',
                    '第一天', '第二天', '第三天', '第四天', '第五天', '第六天', '第七天', '第八天', '第九天', '第十天',
                    '第十一天', '第十二天', '第十三天', '第十四天', '第十五天']
                // const data = [[1, 2, 3], [true, false, null, 'sheetjs'], ['foo', 'bar', new Date('2014-02-19T14:30Z'), '0.3'], ['baz', null, 'qux']];
                data.push(info)
                doc.forEach((child, index) => {
                    let user = [child.email,
                    child.name || '',
                    child.team || '',
                    child.score1 || '0',
                    child.score2 || '0'];
                    for (let j = 0; j <= 19; j++) {
                        if (child.score && child.score.length >= j) {
                            if (child.score[j] != undefined) {
                                user.push(`${child.score[j]}分`)
                            }
                            else {
                                user.push('')
                            }
                        }
                        else {
                            user.push('')
                        }
                    }
                    for (let i = 0; i <= 14; i++) {
                        if (child.progress && child.progress.length >= i) {
                            if (!child.progress[i] || !child.progress[i].value) {
                                user.push('未阅读')
                            }
                            else if (child.progress[i].value == -1) {
                                user.push('未阅读')
                            }
                            else if (child.progress[i].value == 1) {
                                user.push('已阅读')
                            }
                            else if (child.progress[i].value == 2) {
                                user.push('已补读')
                            }
                        }
                        else {
                            user.push('未阅读')
                        }
                    };
                    data.push(user);
                })
                var buffer = xlsx.build([{ name: "user", data: data }]); // Returns a buffer

                // let users = doc.filter((child) => { return child.team && child.team.length > 0 }).map((child, index) => {
                //     return {
                //         name: child.name,
                //         email: child.email,
                //         team: child.team
                //     }
                // });

                fs.writeFile(`${__dirname}/../public/score.xlsx`, buffer, {}, () => {
                    res.redirect('/score.xlsx')
                    db.close();
                });
                // res.send('success');
            }
        });
    });
}

var findAllUser = function (req, res, callBack) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('user').find({}).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed', msg: '服务器错误稍后重试' });
                db.close();
            } else if (!doc || doc.length == 0) {
                res.send({ status: 'failed', msg: '服务器错误稍后重试' });
                db.close();

            } else {
                // callBack && callBack();
                let users = doc.filter((child) => { return child.team && child.team.length > 0 }).map((child, index) => {
                    return {
                        name: child.name,
                        email: child.email,
                        team: child.team
                    }
                });
                res.send({ count: users.length, users });
                db.close();
            }
        });
    });
}
var findUser = function (req, res, callBack) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('user').find({ "email": { $regex: req.query.email.trim(), $options: "$i" } }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed', msg: '服务器错误稍后重试' });
                db.close();
            } else if (!doc || doc.length == 0) {
                res.send({ status: 'failed', msg: '注册信息有误，请联系您的HR' });
                db.close();

            } else {
                callBack && callBack();
                // res.send({ status: 'success', data: doc[0] });
                db.close();
            }
        });
    });
}

var getUser = function (req, res, email, routeName = null) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('user').find({ "email": { $regex: `^${email.trim()}`, $options: "$i" } }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed', msg: '服务器错误稍后重试' });
                db.close();
            } else if (!doc || doc.length == 0) {
                res.send({ status: 'failed', msg: '服务器错误稍后重试' });
                db.close();

            } else {
                if (routeName) {
                    let msg = '恭喜你，'
                    let score1 = doc[0].score1 || 0;
                    let score2 = doc[0].score2 || 0;
                    if (score1 >= 45) {
                        msg = `${msg}你的发现技能得分十分高，`
                    }
                    else if (score1 >= 40 && score1 < 45) {
                        msg = `${msg}你的发现技能得分高，`
                    }
                    else if (score1 >= 35 && score1 < 40) {
                        msg = `${msg}你的发现技能中等偏高，`
                    }
                    else if (score1 >= 29 && score1 < 35) {
                        msg = `${msg}你的发现技能中等偏低，`
                    }
                    else if (score1 <= 28) {
                        msg = `${msg}你的发现技能较低，`
                    }


                    if (score2 >= 45) {
                        msg = `${msg}你的组织或团队创新者基因得分非常高。`
                    }
                    else if (score2 >= 40 && score2 < 45) {
                        msg = `${msg}你的组织或团队创新者基因得分较高。`
                    }
                    else if (score2 >= 35 && score2 < 40) {
                        msg = `${msg}你的组织或团队创新者基因得分中等偏高。`
                    }
                    else if (score2 >= 30 && score2 < 35) {
                        msg = `${msg}你的组织或团队创新者基因得分中等偏低。`
                    }
                    else if (score2 < 30) {
                        msg = `${msg}你的组织或团队创新者基因得分较低。`
                    }

                    if (routeName == 'plan') {
                        let user = doc[0];
                        let mission = ['未读', '未读', '未读', '未读', '未读']
                        db.collection('course').find({}).sort({ day: 1 }).toArray(function (err, doc) {
                            if (doc && doc.length > 0) {
                                let unLockIndex = 0;
                                if (user.progress.length === 0) {
                                    user.progress = [
                                        {
                                            "key": "day1",
                                            "value": -1,
                                        },
                                        {
                                            "key": "day2",
                                            "value": -1
                                        },
                                        {
                                            "key": "day3",
                                            "value": -1
                                        },
                                        {
                                            "key": "day4",
                                            "value": -1
                                        },
                                        {
                                            "key": "day5",
                                            "value": -1
                                        },
                                        {
                                            "key": "day6",
                                            "value": -1
                                        },
                                        {
                                            "key": "day7",
                                            "value": -1
                                        },
                                        {
                                            "key": "day8",
                                            "value": -1
                                        },
                                        {
                                            "key": "day9",
                                            "value": -1
                                        },
                                        {
                                            "key": "day10",
                                            "value": -1
                                        },
                                        {
                                            "key": "day11",
                                            "value": -1
                                        },
                                        {
                                            "key": "day12",
                                            "value": -1
                                        },
                                        {
                                            "key": "day13",
                                            "value": -1
                                        },
                                        {
                                            "key": "day14",
                                            "value": -1
                                        },
                                        {
                                            "key": "day15",
                                            "value": -1
                                        }
                                    ]
                                }
                                user.progress = user.progress.map(function (child, index) {
                                    let unLocked = new Date() >= new Date(doc[index].time);
                                    if (unLocked) {
                                        unLockIndex = index;
                                    }
                                    return {
                                        ...child,
                                        unLocked: unLocked,
                                        readFlag: unLocked ? 2 : 1
                                    }
                                });
                                if (user.progress[unLockIndex]) {
                                    user.progress[unLockIndex].readFlag = 1
                                }
                            }

                            if (user.progress[0].value > 0 || user.progress[1].value > 0 || user.progress[2].value > 0) {
                                if (user.progress[0].value >= 1 && user.progress[1].value >= 1 && user.progress[2].value >= 1) {
                                    //完成
                                    mission[0] = '已读完';
                                }
                                else {
                                    //进行中
                                    mission[0] = '任务中';
                                }
                            }
                            if (user.progress[3].value > 0 || user.progress[4].value > 0 || user.progress[5].value > 0) {
                                if (user.progress[3].value >= 1 && user.progress[4].value >= 1 && user.progress[5].value >= 1) {
                                    //完成
                                    mission[1] = '已读完';
                                }
                                else {
                                    //进行中
                                    mission[1] = '任务中';
                                }
                            }
                            if (user.progress[6].value > 0 || user.progress[7].value > 0 || user.progress[8].value > 0) {
                                if (user.progress[6].value >= 1 && user.progress[7].value >= 1 && user.progress[8].value >= 1) {
                                    //完成
                                    mission[2] = '已读完';
                                }
                                else {
                                    //进行中
                                    mission[2] = '任务中';
                                }
                            }
                            if (user.progress[9].value > 0 || user.progress[10].value > 0 || user.progress[11].value > 0) {
                                if (user.progress[9].value >= 1 && user.progress[10].value >= 1 && user.progress[11].value >= 1) {
                                    //完成
                                    mission[3] = '已读完';
                                }
                                else {
                                    //进行中
                                    mission[3] = '任务中';
                                }
                            }
                            if (user.progress[12].value > 0 || user.progress[13].value > 0 || user.progress[14].value > 0) {
                                if (user.progress[12].value >= 1 && user.progress[13].value >= 1 && user.progress[14].value >= 1) {
                                    //完成
                                    mission[4] = '已读完';
                                }
                                else {
                                    //进行中
                                    mission[4] = '任务中';
                                }
                            }
                            res.render(routeName, { score1, score2, msg, user, mission })
                            db.close();
                        })
                    }
                    else {
                        res.render(routeName, { score1, score2, msg, user: doc[0] })
                        db.close();
                    }
                }
                else {
                    res.send({ status: 'success', data: doc[0] });
                    db.close();
                }
            }
        });
    });
}

var addUser = function (req, res, info = null, isRedirect = false) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('user').find({ "email": { $regex: req.query.email.trim(), $options: "$i" } }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed', msg: '服务器错误稍后重试' });
                db.close();
            } else if (!doc || doc.length == 0) {
                db.collection('user').insertOne({
                    "email": req.query.email,
                    "createTime": new Date()
                }, function () {
                    res.send({ status: 'success', msg: '成功添加' });
                    db.close();
                })
                // res.send({ status: 'failed', msg: '邮箱没权限，请联系管理员' });
                // db.close();

            } else {
                console.log('info', info)
                let user = doc[0];
                let progress = user.progress && user.progress.length > 0 ? user.progress :
                    [
                        {
                            "key": "day1",
                            "value": -1,
                        },
                        {
                            "key": "day2",
                            "value": -1
                        },
                        {
                            "key": "day3",
                            "value": -1
                        },
                        {
                            "key": "day4",
                            "value": -1
                        },
                        {
                            "key": "day5",
                            "value": -1
                        },
                        {
                            "key": "day6",
                            "value": -1
                        },
                        {
                            "key": "day7",
                            "value": -1
                        },
                        {
                            "key": "day8",
                            "value": -1
                        },
                        {
                            "key": "day9",
                            "value": -1
                        },
                        {
                            "key": "day10",
                            "value": -1
                        },
                        {
                            "key": "day11",
                            "value": -1
                        },
                        {
                            "key": "day12",
                            "value": -1
                        },
                        {
                            "key": "day13",
                            "value": -1
                        },
                        {
                            "key": "day14",
                            "value": -1
                        },
                        {
                            "key": "day15",
                            "value": -1
                        }
                    ];

                if (info) {
                    db.collection('user').updateOne({ "email": { $regex: req.query.email.trim(), $options: "$i" } }, {
                        $set: {
                            "openId": info.openId,
                            "name": user.name || info.name,
                            "avator": info.avator,
                            "team": user.team || info.team,
                            "phone": user.phone || info.phone,
                            "progress": progress
                        },
                        $currentDate: { "lastModified": true }
                    }, function () {
                        res.cookie('user', req.query.email, { maxAge: 60 * 24 * 60 * 60 * 1000 })
                        if (isRedirect) {
                            res.redirect('/' + req.query.url);
                        }
                        else {
                            res.send({ status: 'success', msg: '成功添加' });
                        }
                        db.close();
                    });
                }
                else {
                    res.send({ status: 'failed', msg: '已存在' });
                    db.close();
                }
                // res.send('<div>已存在请重新添加</div>');
                // res.send({ status: 'success', data: doc[0] });
            }
        });
    });
}

var createScore = function (req, res, email) {
    let score = req.query.score.split(',').map((child) => { return parseInt(child) + 1 });
    let score2 = score[1] + score[3] + score[5] + score[7] + score[9] + score[11] + score[13] + score[15] + score[17] + score[19];
    let score1 = score[0] + score[2] + score[4] + score[6] + score[8] + score[10] + score[12] + score[14] + score[16] + score[18];
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('user').updateOne({ "email": { $regex: `^${email.trim()}`, $options: "$i" } }, {
            $set: {
                "score": score,
                "score1": score1,
                "score2": score2
            },
            $currentDate: { "lastModified": true }
        }, function () {
            // res.cookie('user', req.query.email, { maxAge: 60 * 24 * 60 * 60 * 1000 })
            res.send({ status: 'success', msg: '成功做题' });
            db.close();
        });
    });
}

var readCourse = function (req, res, email) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('user').find({ "email": { $regex: `^${email.trim()}`, $options: "$i" } }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed', msg: '服务器错误稍后重试' });
                db.close();
            } else if (!doc || doc.length == 0) {
                res.send({ status: 'redirect', redirectUrl: '/sign', msg: 'redirect' })
                // res.send({ status: 'failed', msg: '邮箱没权限，请联系管理员' });
                db.close();

            } else {
                let user = doc[0];
                let day = req.query.day;
                let progress = Object.assign([], user.progress);
                if (user.progress.length === 0) {
                    user.progress = [
                        {
                            "key": "day1",
                            "value": -1,
                        },
                        {
                            "key": "day2",
                            "value": -1
                        },
                        {
                            "key": "day3",
                            "value": -1
                        },
                        {
                            "key": "day4",
                            "value": -1
                        },
                        {
                            "key": "day5",
                            "value": -1
                        },
                        {
                            "key": "day6",
                            "value": -1
                        },
                        {
                            "key": "day7",
                            "value": -1
                        },
                        {
                            "key": "day8",
                            "value": -1
                        },
                        {
                            "key": "day9",
                            "value": -1
                        },
                        {
                            "key": "day10",
                            "value": -1
                        },
                        {
                            "key": "day11",
                            "value": -1
                        },
                        {
                            "key": "day12",
                            "value": -1
                        },
                        {
                            "key": "day13",
                            "value": -1
                        },
                        {
                            "key": "day14",
                            "value": -1
                        },
                        {
                            "key": "day15",
                            "value": -1
                        }
                    ]
                }
                progress = progress.map((child, index) => {
                    let value = child.key == `day${day}` && child.value < 0 ? (parseInt(req.query.readFlag) || 1) : child.value;
                    let color = 'bgGrey';
                    if (value == 1) {
                        color = 'bgBlue';
                    }
                    if (value == 2) {
                        color = 'bgOrange'
                    }
                    return {
                        key: child.key,
                        value: value,
                        color: color
                    }
                })
                db.collection('user').updateOne({ "email": { $regex: `^${email.trim()}`, $options: "$i" } }, {
                    $set: {
                        progress
                    },
                    $currentDate: { "lastModified": true }
                }, function () {
                    // res.cookie('user', req.query.email, { maxAge: 60 * 24 * 60 * 60 * 1000 })
                    res.send({ status: 'success', msg: '成功签到' });
                    db.close();
                });
                // res.send('<div>已存在请重新添加</div>');
                // res.send({ status: 'success', data: doc[0] });
            }
        });
    });
}

var getRead = function (req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('course').find({}).sort({ day: -1 }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed', msg: '服务器错误稍后重试' });
                db.close();
            } else if (!doc || doc.length == 0) {
                res.send({ status: 'failed', msg: '服务器错误稍后重试' });
                db.close();

            } else {
                let course = doc.filter((child) => {
                    return new Date() >= new Date(child.time)
                });
                if (course.length > 0) {
                    course[0].title = '今日阅读'
                    if (course.length > 1) {
                        // course=[course[0], course[1]]

                        course = [course[0]]
                    }
                }
                res.render('read', { course })
                // callBack && callBack();
                // res.send({ status: 'success', data: doc[0] });
                db.close();
            }
        });
    });
}

var getUserTeam = function (req, res, email) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('user').find({ "email": { $regex: `^${email.trim()}`, $options: "$i" } }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed', msg: '服务器错误稍后重试' });
                db.close();
            } else if (!doc || doc.length == 0) {
                res.send({ status: 'failed', msg: '服务器错误稍后重试' });
                db.close();

            } else {
                let user = doc[0];
                db.collection('user').find({}).toArray(function (err, doc) {
                    if (doc && doc.length > 0) {
                        let myTeam = doc.filter((child) => {
                            return child.team === user.team;
                        })
                        let myTeamReadPerson = {};
                        let myReadProgress = {};
                        let group = {};
                        let myTeamReadProgressWithinTeam = 0;
                        let myTeamReadProgressWithinGroup = 0;
                        myReadProgress.readProgressDay = user.progress.filter((child) => {
                            return child.value > 0
                        }).length;
                        myReadProgress.percentage = Math.ceil((myReadProgress.readProgressDay / 15) * 100);

                        myTeamReadPerson.allPersonCount = team[user.team];
                        myTeamReadPerson.readPersonCount = myTeam.length;
                        myTeamReadPerson.percentage = Math.ceil((myTeamReadPerson.readPersonCount / myTeamReadPerson.allPersonCount) * 100);

                        let teamReadCount = 0;
                        myTeam.forEach((child) => {
                            if (child && child.progress && child.progress.length > 0) {
                                teamReadCount += child.progress.filter((child) => {
                                    return child.value > 0
                                }).length;
                            }
                        });
                        let groupReadCount = 0;
                        doc.forEach((child) => {
                            if (child && child.progress && child.progress.length > 0) {
                                groupReadCount += child.progress.filter((child) => {
                                    return child.value > 0
                                }).length;
                            }
                        });

                        group.allPersonCount = team['All'];
                        // group.allPersonCount = doc.filter((child)=>{
                        //     return child && child.progress && child.progress.length > 0
                        // }).length;
                        group.readPersonCount = 0;
                        doc.forEach((child) => {
                            if (child && child.progress && child.progress.length > 0) {
                                group.readPersonCount += 1;
                            }
                        });
                        group.percentage = Math.ceil((group.readPersonCount / group.allPersonCount) * 100);

                        myTeamReadProgressWithinTeam = Math.ceil((teamReadCount / (myTeamReadPerson.allPersonCount * 15)) * 100)
                        myTeamReadProgressWithinGroup = Math.ceil((groupReadCount / (team['All'] * 15)) * 100)
                        res.render('myProcess', { myReadProgress, myTeamReadPerson, myTeamReadProgressWithinTeam, myTeamReadProgressWithinGroup, group })
                    }
                    else {
                        res.send({ status: 'failed', msg: '服务器错误稍后重试' });
                        db.close();
                    }
                })
            }
        });
    });
}

var getRanking = function (req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('user').find({}).toArray(function (err, doc) {
            if (doc && doc.length > 0) {
                let readGroup = [];
                let inGroup = [];
                for (let key in team) {
                    if (key === 'All') {
                        continue;
                    }
                    let currentTeam = doc.filter((child) => { return child.team && child.team.trim() === key.trim() });
                    let readPersonCount = currentTeam.length;


                    let allPersonCount = team[key];
                    // let allPersonCount = currentTeam.filter((child) => {
                    //     return child && child.progress && child.progress.length > 0
                    // }).le;


                    let percentage = Math.ceil((readPersonCount / allPersonCount) * 100);
                    inGroup.push({
                        readPersonCount,
                        allPersonCount,
                        percentage,
                        title: key
                    });

                    let teamReadCount = 0;
                    currentTeam.forEach((child) => {
                        if (child && child.progress && child.progress.length > 0) {
                            teamReadCount += child.progress.filter((child) => {
                                return child.value > 0
                            }).length;
                        }
                    });

                    readGroup.push({
                        title: key,
                        readPercentage: Math.ceil((teamReadCount / (readPersonCount * 15)) * 100)
                    })
                }
                res.render('ranking', {
                    readGroup: readGroup.sort(function (a, b) {
                        if (a.readPercentage > b.readPercentage) {
                            return -1;
                        }
                        else if (a.readPercentage < b.readPercentage) {
                            return 1;
                        }
                        else {
                            return 0;
                        }
                    }),
                    inGroup: inGroup.sort(function (a, b) {
                        if (a.percentage > b.percentage) {
                            return -1;
                        }
                        else if (a.percentage < b.percentage) {
                            return 1;
                        }
                        else {
                            return 0;
                        }
                        // return a.percentage <= b.percentage
                    })
                })
            }
            else {
                res.send({ status: 'failed', msg: '服务器错误稍后重试' });
                db.close();
            }
        })
    })
}



function caculateRanking() {

}






var subscribeF = function (openId, preLevel, data, req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('user').find({ "openId": openId }).toArray(function (err, doc) {
            if (err) {
                db.close();
            } else if (!doc || doc.length == 0) {
                var time = new Date().toLocaleDateString();
                var arr = time.split('/');
                var day = arr.length === 3 ? arr[2] + '-' + arr[0] + '-' + arr[1] : arr[0];
                if (preLevel && preLevel.length > 0) {
                    mongoClient.connect(mogoUrl, function (err, db) {
                        var cursor = db.collection('user').find({ "openId": preLevel }).toArray(function (err, doc) {
                            if (err) {
                                db.collection('user').insertOne({
                                    "userId": "uid" + data.openid,
                                    "openId": data.openid,
                                    "preLevel": preLevel || "",
                                    "name": data.nickname,
                                    'avator': data.headimgurl,
                                    "createTime": day,
                                    "city": data.province
                                }, function () {
                                    db.close();
                                })
                            } else if (!doc || doc.length == 0) {
                                db.collection('user').insertOne({
                                    "userId": "uid" + data.openid,
                                    "openId": data.openid,
                                    "preLevel": preLevel || "",
                                    "name": data.nickname,
                                    'avator': data.headimgurl,
                                    "createTime": day,
                                    "city": data.province
                                }, function () {
                                    db.close();
                                })

                            } else {
                                db.collection('user').insertOne({
                                    "userId": "uid" + data.openid,
                                    "openId": data.openid,
                                    "preLevel": preLevel || "",
                                    "preName": doc[0].name,
                                    "name": data.nickname,
                                    'avator': data.headimgurl,
                                    "createTime": day,
                                    "city": data.province
                                }, function () {
                                    db.close();
                                })
                                // db.close();
                            }
                        });
                    });
                }
            }
        });
    });
}

var checkUserExists = function (openId, data, req, res, callBack) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('user').find({ "openId": openId }).toArray(function (err, doc) {
            if (err) {
                db.close();
            } else if (!doc || doc.length == 0) {
                callBack(data, req, res);
                db.close();

            } else {
                var user = doc[0];
                if (user.name) {
                    req.session.user.name = user.name;
                    callBack(null, req, res);
                } else {
                    console.log('datadata', data)
                    req.session.user.name = data.nickname;
                    db.collection('user').updateOne({ "openId": openId }, {
                        $set: {
                            "name": data.nickname,
                            'avator': data.headimgurl,
                            "city": data.province
                        },
                        $currentDate: { "lastModified": true }
                    });
                    if (data.subscribe) {
                        res.redirect('/' + req.query.url);
                    } else {
                        res.redirect('/order');
                    }
                }
                db.close();
            }
        });
    });
}

var createUser = function (data, preLevel, req, res) {
    var time = new Date().toLocaleDateString();
    var arr = time.split('/');
    var day = arr.length === 3 ? arr[2] + '-' + arr[0] + '-' + arr[1] : arr[0];
    req.session.user.name = data.name;
    if (preLevel && preLevel.length > 0) {
        mongoClient.connect(mogoUrl, function (err, db) {
            var cursor = db.collection('user').find({ "openId": preLevel }).toArray(function (err, doc) {
                if (err) {
                    db.collection('user').insertOne({
                        "userId": "uid" + data.openid,
                        "openId": data.openid,
                        "preLevel": preLevel || "",
                        "name": data.nickname,
                        'avator': data.headimgurl,
                        "createTime": day,
                        // "phone": "",
                        // "idCard": "",
                        // "photo": [

                        // ],
                        // "initialWeight": "77",
                        // "waist": "23",
                        // "hipline": "33",
                        // "arm": "44",
                        "city": data.province
                    }, function () {
                        db.close();
                        if (data.subscribe) {
                            res.redirect('/' + req.query.url);
                        } else {
                            res.redirect('/order');
                        }
                    })
                } else if (!doc || doc.length == 0) {
                    db.collection('user').insertOne({
                        "userId": "uid" + data.openid,
                        "openId": data.openid,
                        "preLevel": preLevel || "",
                        "name": data.nickname,
                        'avator': data.headimgurl,
                        "createTime": day,
                        // "phone": "",
                        // "idCard": "",
                        // "photo": [

                        // ],
                        // "initialWeight": "77",
                        // "waist": "23",
                        // "hipline": "33",
                        // "arm": "44",
                        "city": data.province
                    }, function () {
                        db.close();
                        if (data.subscribe) {
                            res.redirect('/' + req.query.url);
                        } else {
                            res.redirect('/order');
                        }
                    })
                    // db.close();

                } else {
                    console.log('data', data)
                    db.collection('user').insertOne({
                        "userId": "uid" + data.openid,
                        "openId": data.openid,
                        "preLevel": preLevel || "",
                        "preName": doc[0].name,
                        "name": data.nickname,
                        'avator': data.headimgurl,
                        "createTime": day,
                        // "phone": "",
                        // "idCard": "",
                        // "photo": [

                        // ],
                        // "initialWeight": "77",
                        // "waist": "23",
                        // "hipline": "33",
                        // "arm": "44",
                        "city": data.province
                    }, function () {
                        db.close();
                        if (data.subscribe) {
                            res.redirect('/' + req.query.url);
                        } else {
                            res.redirect('/order');
                        }
                    })
                    // db.close();
                }
            });
        });
    } else {
        mongoClient.connect(mogoUrl, function (err, db) {
            console.log('data', data)
            db.collection('user').insertOne({
                "userId": "uid" + data.openid,
                "openId": data.openid,
                "preLevel": preLevel || "",
                "name": data.nickname,
                'avator': data.headimgurl,
                "createTime": day,
                // "phone": "",
                // "idCard": "",
                // "photo": [

                // ],
                // "initialWeight": "77",
                // "waist": "23",
                // "hipline": "33",
                // "arm": "44",
                "city": data.province
            }, function () {
                db.close();
                if (data.subscribe) {
                    res.redirect('/' + req.query.url);
                } else {
                    res.redirect('/order');
                }
            })
            // db.close();
        });
    }
}

var getUserInfo = function (req, res, isAll = false) {
    if (isAll) {
        mongoClient.connect(mogoUrl, function (err, db) {
            var cursor = db.collection('user').find().toArray(function (err, doc) {
                if (err) {
                    res.send({ status: 'failed' });
                    db.close();
                } else if (!doc || doc.length == 0) {
                    res.send(viewHandler.buildAllUserView(null));
                    db.close();

                } else {
                    var persons = [];
                    var users = doc;
                    doc.map((child, index) => {
                        persons.push({
                            person: child.openId
                        })
                    })
                    db.collection('benfits').find({ $or: persons }).toArray(function (err, doc) {
                        if (err) {
                            var html = viewHandler.buildAllUserView(users);
                            res.send(html);
                            db.close();
                        }
                        else if (!doc || doc.length === 0) {
                            var html = viewHandler.buildAllUserView(users);
                            res.send(html);
                            db.close();
                        }
                        else {
                            var html = viewHandler.buildAllUserView(users, doc);
                            res.send(html);
                            db.close();
                        }
                    });
                }
            });
        });
    } else {
        mongoClient.connect(mogoUrl, function (err, db) {
            var cursor = db.collection('user').find({ "openId": req.query.openId }).toArray(function (err, doc) {
                if (err) {
                    res.send({ status: 'failed' });
                    db.close();
                } else if (!doc || doc.length == 0) {
                    res.send({ status: 'failed' });
                    db.close();

                } else {
                    res.send({ status: 'success', data: doc[0] });
                    db.close();
                }
            });
        });
    }
}

var updateUser = function (req, res, openId) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('user').updateOne({ "openId": openId }, {
            $set: {
                phone: req.body.phone,
                name: req.body.name,
                idCard: req.body.idCard,
                initialWeight: parseFloat(req.body.initialWeight),
                waist: parseFloat(req.body.waist),
                arm: parseFloat(req.body.arm)
            },
            $currentDate: { "lastModified": true }
        });
        db.collection('clock').find({ "openId": openId }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed' });
                db.close();
            } else if (!doc || doc.length == 0) {
                // res.send({ status: 'failed' });
                db.collection('clock').insertOne({
                    "openId": openId,
                    "initialWeight": parseFloat(req.body.initialWeight)
                });
                res.send({ status: 'success' });
                db.close();

            } else {
                res.send({ status: 'success' });
                db.close();
            }
        });
        // db.collection('clock').updateOne({ "openId": openId }, {
        //     $set: {
        //         initialWeight: parseFloat(req.body.initialWeight)
        //     },
        //     $currentDate: { "lastModified": true }
        // });
        // res.send({ status: 'success' })
        // db.close();
    })
}

var getOrder = function (req, res, getAll = false) {
    mongoClient.connect(mogoUrl, function (err, db) {
        if (getAll) {
            var cursor = db.collection('order').find().sort({ createTime: -1 }).toArray(function (err, doc) {
                if (err) {
                    res.send({ status: 'failed' });
                    db.close();
                } else if (!doc || doc.length == 0) {
                    res.send('<div></div>');
                    db.close();

                } else {
                    var html = viewHandler.buildAllOrderView(doc);
                    res.send(html);
                    db.close();
                }
            });
        } else {
            var cursor = db.collection('order').find({ "openId": req.query.openId }).sort({ createTime: -1 }).toArray(function (err, doc) {
                if (err) {
                    res.send({ status: 'failed' });
                    db.close();
                } else if (!doc || doc.length == 0) {
                    res.send({ status: 'failed' });
                    db.close();

                } else {
                    res.send({ status: 'success', data: doc });
                    db.close();
                }
            });
        }
    });
}

var getPreLevel = function (req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('user').find({ "preLevel": req.query.openId }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed' });
                db.close();
            } else if (!doc || doc.length == 0) {
                res.send({ status: 'success', data: { currentName: "", firstLevel: [], secondLevel: [], thirdLevel: [] } });
                db.close();

            } else {
                var firstLevel = doc;
                var seconds = [];
                var currentName = "";
                doc.map((child, index) => {
                    if (child.openId) {
                        seconds.push({ preLevel: child.openId });
                        currentName = child.preName;
                    }
                })
                db.collection('user').find({ $or: seconds }).toArray(function (err, doc) {
                    if (err) {
                        res.send({ status: 'failed' });
                        db.close();
                    } else if (!doc || doc.length == 0) {
                        res.send({ status: 'success', data: { currentName, firstLevel, secondLevel: [], thirdLevel: [] } });
                        db.close();

                    } else {
                        var secondLevel = doc;
                        var thirds = [];
                        doc.map((child, index) => {
                            if (child.openId) {
                                thirds.push({ preLevel: child.openId });
                            }
                        })
                        db.collection('user').find({ $or: thirds }).toArray(function (err, doc) {
                            if (err) {
                                res.send({ status: 'failed' });
                                db.close();
                            } else if (!doc || doc.length == 0) {
                                res.send({ status: 'success', data: { currentName, firstLevel, secondLevel, thirdLevel: [] } });
                                db.close();

                            } else {
                                res.send({ status: 'success', data: { currentName, firstLevel, secondLevel, thirdLevel: doc } });
                                db.close();
                            }
                        });
                        // res.send({ status: 'success', data: doc });
                        // db.close();
                    }
                });
                // res.send({ status: 'success', data: doc });
            }
        });
    });
}

var getBenfits = function (req, res, peronName = null) {
    if (peronName && peronName.length > 0) {
        mongoClient.connect(mogoUrl, function (err, db) {
            var cursor = db.collection('benfits').find({ "peronName": peronName }).sort({ time: -1 }).toArray(function (err, doc) {
                if (err) {
                    res.send({ status: 'failed' });
                    db.close();
                } else if (!doc || doc.length == 0) {
                    res.send(viewHandler.buildAllUserBenfitsView([{ peronName: peronName }]));
                    db.close();

                } else {
                    var data = doc;
                    res.send(viewHandler.buildAllUserBenfitsView(data));
                }
            });
        });
    }
    else {
        mongoClient.connect(mogoUrl, function (err, db) {
            var cursor = db.collection('benfits').find({ "person": req.query.openId }).toArray(function (err, doc) {
                if (err) {
                    res.send({ status: 'failed' });
                    db.close();
                } else if (!doc || doc.length == 0) {
                    res.send({ status: 'failed' });
                    db.close();

                } else {
                    var data = doc;
                    db.collection('user').find({ "openId": req.query.openId }).toArray(function (err, doc) {
                        if (err) {
                            res.send({ status: 'failed' });
                            db.close();
                        } else if (!doc || doc.length == 0) {
                            res.send({ status: 'failed' });
                            db.close();

                        } else {
                            var benfits = doc[0].myBenfits ? doc[0].myBenfits : 0;
                            db.collection('withDraw').find({ openId: req.query.openId }).toArray(function (err, doc) {
                                if (err) {
                                    // res.send({ status: 'failed' })
                                    res.send({ status: 'success', data: data, benfits: benfits });
                                    db.close();
                                } else if (!doc || doc.length === 0) {
                                    res.send({ status: 'failed' })
                                    res.send({ status: 'success', data: data, benfits: benfits });
                                    db.close();
                                } else {
                                    // res.send({ status: 'success', data: doc })
                                    res.send({ status: 'success', data: data, benfits: benfits, myWithDraw: doc });
                                    db.close();
                                }
                            })

                            // res.send({ status: 'success', data: data, benfits: doc[0].myBenfits ? doc[0].myBenfits : 0 });
                            // db.close();
                        }
                    });
                }
            });
        });
    }
}


var getUserClock = function (req, res, openId, persons, count) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('clock').find({ "openId": openId }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed' });
                db.close();
            } else if (!doc || doc.length == 0) {
                res.send({ status: 'success', persons, count, data: {} });
                db.close();

            } else {
                res.send({ status: 'success', data: doc[0], persons, count });
                db.close();
            }
        });
    });
}

var getClockIndex = function (req, res, ranking = flase) {
    var time = new Date().toLocaleDateString();
    var arr = time.split('/');
    var day = arr.length === 3 ? arr[2] + '-' + arr[0] + '-' + arr[1] : arr[0];
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('clock').find({ "clockCount": { $gt: 0 }, "clockTime": day }).sort({ reduceWeight: -1 }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed' });
                db.close();
            } else if (!doc || doc.length == 0) {
                // res.send({ status: 'success', count: 0, persons: [] });
                getUserClock(req, res, req.query.openId, [], 0);
                db.close();
            } else {
                var persons = [];
                doc.map((child, index) => {
                    if (child.avator) {
                        persons.push(child.avator);
                    }
                });
                getUserClock(req, res, req.query.openId, ranking ? doc : persons.splice(0, 19), doc.length);
                // res.send({ status: 'success', count: doc.length, persons });
                db.close();
            }
        });
    });
}

var updateClock = function (req, res, openId) {
    if (req.body.id === '01') {
        mongoClient.connect(mogoUrl, function (err, db) {
            var cursor = db.collection('user').find({ "openId": openId }).toArray(function (err, doc) {
                if (err) {
                    res.send({ status: 'failed' });
                    db.close();
                } else if (!doc || doc.length == 0) {
                    res.send({ status: 'failed' });
                    db.close();

                } else {
                    var user = doc[0];
                    var rrweight = parseFloat(req.body.weight) > 0 ? parseFloat(req.body.weight) : 0;
                    if (!user.initialWeight || !user.initialWeight > 0) {
                        user.initialWeight = rrweight;
                    }
                    db.collection('clock').find({ "openId": openId }).toArray(function (err, doc) {
                        if (err) {
                            res.send({ status: 'failed' });
                            db.close();
                        } else if (!doc || doc.length == 0) {
                            db.collection('clock').insertOne({
                                "openId": openId,
                                "name": user.name,
                                "clockId": "cid_" + openId,
                                "initialWeight": user.initialWeight,
                                "clockCount": 1,
                                "avator": user.avator,
                                "clockTime": req.body.day.replace(/\//g, '-'),
                                "preWeight": user.initialWeight,
                                "currentWeight": rrweight > 0 ? rrweight : user.initialWeight,
                                "reduceWeight": rrweight > 0 ? user.initialWeight - rrweight : 0,
                                "clock": [{
                                    "id": req.body.id,
                                    "day": req.body.day.replace(/\//g, '-'),
                                    "weight": rrweight > 0 ? rrweight : user.initialWeight,
                                    "reduceWeight": rrweight > 0 ? user.initialWeight - rrweight : 0,
                                    "breadfast": req.body.breadfast,
                                    "launch": req.body.launch,
                                    "dinner": req.body.dinner,
                                    "drink": req.body.drink,
                                    "sleep": req.body.sleep,
                                    "health": req.body.health && req.body.health.trim() === '是' ? true : false
                                }]
                            })
                            res.send({ status: 'success' });
                            db.close();

                        } else {
                            db.collection('clock').updateOne({ "openId": openId }, {
                                $set: {
                                    "openId": openId,
                                    "name": user.name,
                                    "clockId": "cid_" + openId,
                                    "initialWeight": user.initialWeight,
                                    "clockCount": 1,
                                    "avator": user.avator,
                                    "clockTime": req.body.day.replace(/\//g, '-'),
                                    "preWeight": user.initialWeight,
                                    "currentWeight": rrweight > 0 ? rrweight : user.initialWeight,
                                    "reduceWeight": rrweight > 0 ? user.initialWeight - rrweight : 0,
                                    "clock": [{
                                        "id": req.body.id,
                                        "day": req.body.day.replace(/\//g, '-'),
                                        "weight": rrweight > 0 ? rrweight : user.initialWeight,
                                        "reduceWeight": rrweight > 0 ? user.initialWeight - rrweight : 0,
                                        "breadfast": req.body.breadfast,
                                        "launch": req.body.launch,
                                        "dinner": req.body.dinner,
                                        "drink": req.body.drink,
                                        "sleep": req.body.sleep,
                                        "health": req.body.health && req.body.health.trim() === '是' ? true : false
                                    }]
                                }
                            });

                            res.send({ status: 'success' });
                            db.close();
                        }
                    });
                    // res.send({ status: 'success' });
                    // db.close();
                }
            });
        });
    } else {
        mongoClient.connect(mogoUrl, function (err, db) {
            var cursor = db.collection('clock').find({ "openId": openId }).toArray(function (err, doc) {
                if (err) {
                    res.send({ status: 'failed' });
                    db.close();
                } else if (!doc || doc.length == 0) {
                    res.send({ status: 'failed' });
                    db.close();

                } else {
                    var user = Object.assign({}, doc[0]);
                    user.clockTime = req.body.day.replace(/\//g, '-');
                    user.preWeight = user.currentWeight;
                    user.currentWeight = parseFloat(req.body.weight) > 0 ? parseFloat(req.body.weight) : user.currentWeight,
                        user.reduceWeight = user.preWeight - user.currentWeight;
                    user.clock.push({
                        "id": req.body.id,
                        "day": req.body.day.replace(/\//g, '-'),
                        "weight": parseFloat(req.body.weight) > 0 ? parseFloat(req.body.weight) : user.currentWeight,
                        "reduceWeight": user.preWeight - user.currentWeight,
                        "breadfast": req.body.breadfast,
                        "launch": req.body.launch,
                        "dinner": req.body.dinner,
                        "drink": req.body.drink,
                        "sleep": req.body.sleep,
                        "health": req.body.health && req.body.health.trim() === '是' ? true : false
                    })
                    user.clockCount = user.clock.length;
                    db.collection('clock').updateOne({ "openId": openId }, {
                        $set: user
                    });
                    // db.collection('clock').insertOne({
                    //     "openId": openId,
                    //     "name": user.name,
                    //     "clockId": "cid_" + openId,
                    //     "initialWeight": user.initialWeight,
                    //     "clockCount": 1,
                    //     "avator": user.avator,
                    //     "clockTime": req.body.day,
                    //     "preWeight": user.initialWeight,
                    //     "currentWeight": parseFloat(req.body.weight) > 0 ? parseFloat(req.body.weight) : user.initialWeight,
                    //     "reduceWeight": parseFloat(req.body.weight) > 0 ? user.initialWeight - parseFloat(req.body.weight) : 0,
                    //     "clock": [{
                    //         "id": req.body.id,
                    //         "day": req.body.day,
                    //         "weight": parseFloat(req.body.weight) > 0 ? parseFloat(req.body.weight) : user.initialWeight,
                    //         "reduceWeight": parseFloat(req.body.weight) > 0 ? user.initialWeight - parseFloat(req.body.weight) : 0,
                    //         "breadfast": req.body.breadfast,
                    //         "launch": req.body.launch,
                    //         "dinner": req.body.dinner,
                    //         "drink": req.body.drink,
                    //         "sleep": req.body.sleep,
                    //         "health": req.body.health && req.body.health.trim() === '是' ? true : false
                    //     }]
                    // })

                    res.send({ status: 'success' });
                    db.close();
                }
            });
        });
    }
    // mongoClient.connect(mogoUrl, function(err, db) {
    //     db.collection('clock').updateOne({ "openId": openId }, {
    //         $set: {
    //             initialWeight: parseFloat(req.body.initialWeight)
    //         },
    //         $currentDate: { "lastModified": true }
    //     });
    //     res.send({ status: 'success' })
    //     db.close();
    // })
}

//1为待发货，2为已发货;1未提现2提现 
var createOrder = function (req, res, openId) {
    var time = new Date().toLocaleDateString();
    var arr = time.split('/');
    var day = arr.length === 3 ? arr[2] + '-' + arr[0] + '-' + arr[1] : arr[0];
    // var name = inputs[0].value;
    // var phone = inputs[1].value;
    // var address = inputs[2].value;
    // var weight = inputs[3].value;
    // var waist = inputs[4].value;
    // var hipline = inputs[5].value;
    // var arm = inputs[6].value;
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('order').insertOne({
            "openId": openId,
            "name": req.body.name,
            "phone": req.body.phone,
            "address": req.body.address,
            "orderId": "oid_" + openId + "_" + new Date().getTime(),
            "createTime": new Date().toLocaleString(),
            "cost": 4200,
            "status": 1
        });
        db.collection('user').find({ openId: openId }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'success' });
                db.close();
            } else if (!doc || doc.length === 0) {
                res.send({ status: 'success' })
                db.close();
            } else {
                var customer = doc[0];
                if (customer.preLevel) {
                    db.collection('user').find({ openId: customer.preLevel }).toArray(function (err, doc) {
                        if (err) {
                            res.send({ status: 'success' })
                            db.close();
                        } else if (!doc || doc.length === 0) {
                            res.send({ status: 'success' })
                            db.close();
                        } else {
                            var firstLevel = doc[0];
                            db.collection('benfits').insertOne({
                                "customer": customer.openId,
                                "customerName": customer.name,
                                "customerLevel": "1",
                                "avator": customer.avator,
                                "person": firstLevel.openId,
                                "peronName": firstLevel.name,
                                "benfits": 4200 * 0.24,
                                "time": day,
                                "status": 1
                            });
                            db.collection('user').updateOne({ "openId": firstLevel.openId }, {
                                $set: {
                                    myBenfits: firstLevel.myBenfits ? firstLevel.myBenfits + 4200 * 0.24 : 4200 * 0.24
                                }
                            });
                            if (firstLevel.preLevel) {
                                db.collection('user').find({ openId: firstLevel.preLevel }).toArray(function (err, doc) {
                                    if (err) {
                                        res.send({ status: 'success' })
                                        db.close();
                                    } else if (!doc || doc.length === 0) {
                                        res.send({ status: 'success' })
                                        db.close();
                                    } else {
                                        var secondLevel = doc[0];
                                        db.collection('benfits').insertOne({
                                            "customer": customer.openId,
                                            "customerName": customer.name,
                                            "customerLevel": "2",
                                            "avator": customer.avator,
                                            "person": secondLevel.openId,
                                            "peronName": secondLevel.name,
                                            "benfits": 4200 * 0.12,
                                            "time": day,
                                            "status": 1
                                        });
                                        db.collection('user').updateOne({ "openId": secondLevel.openId }, {
                                            $set: {
                                                myBenfits: secondLevel.myBenfits ? secondLevel.myBenfits + 4200 * 0.12 : 4200 * 0.12
                                            }
                                        });
                                        if (secondLevel.preLevel) {
                                            db.collection('user').find({ openId: secondLevel.preLevel }).toArray(function (err, doc) {
                                                if (err) {
                                                    res.send({ status: 'success' })
                                                    db.close();
                                                } else if (!doc || doc.length === 0) {
                                                    res.send({ status: 'success' })
                                                    db.close();
                                                } else {
                                                    var thirdLevel = doc[0];
                                                    db.collection('benfits').insertOne({
                                                        "customer": customer.openId,
                                                        "customerName": customer.name,
                                                        "customerLevel": "3",
                                                        "avator": customer.avator,
                                                        "person": thirdLevel.openId,
                                                        "peronName": thirdLevel.name,
                                                        "benfits": 4200 * 0.08,
                                                        "time": day,
                                                        "status": 1
                                                    });
                                                    db.collection('user').updateOne({ "openId": thirdLevel.openId }, {
                                                        $set: {
                                                            myBenfits: thirdLevel.myBenfits ? thirdLevel.myBenfits + 4200 * 0.08 : 4200 * 0.08
                                                        }
                                                    });
                                                    res.send({ status: 'success' })
                                                    db.close();
                                                }
                                            })
                                        }
                                    }
                                })
                            }
                        }
                    })
                } else {
                    res.send({ status: 'success' })
                }
            }
        })

        // db.collection('user').find({ openId: openId }).toArray(function(err, doc) {
        //     if (err) {
        //         res.send({ status: 'success' })
        // db.close();
        //     } else if (!doc || doc.length === 0) {
        //         res.send({ status: 'success' })
        // db.close();
        //     } else {
        //         var customer = doc[0];
        //     }
        // })
    })

    // {
    //     "customer": "123456786",
    //     "customerName": "ggg",
    //     "customerLevel": "3",
    //     "avator": "/images/portrait.png",
    //     "person": "123456789",
    //     "peronName": "aaa",
    //     "benfits": 400,
    //     "time": "2018-01-13",
    //     "status": 1
    // } {
    //     "customer": "123456786",
    //     "customerName": "ggg",
    //     "customerLevel": "2",
    //     "avator": "/images/portrait.png",
    //     "person": "123456788",
    //     "peronName": "eee",
    //     "benfits": 600,
    //     "time": "2018-01-13",
    //     "status": 1
    // } {
    //     "customer": "123456786",
    //     "customerName": "ggg",
    //     "customerLevel": "1",
    //     "avator": "/images/portrait.png",
    //     "person": "123456787",
    //     "peronName": "fff",
    //     "benfits": 1200,
    //     "time": "2018-01-13",
    //     "status": 1
    // }
}

//1进行中，2成功，3失败
var withDraw = function (req, res, openId) {
    var time = new Date().toLocaleDateString();
    var arr = time.split('/');
    var day = arr.length === 3 ? arr[2] + '-' + arr[0] + '-' + arr[1] : arr[0];
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('user').find({ openId: openId }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed' })
                db.close();
            } else if (!doc || doc.length === 0) {
                res.send({ status: 'failed' })
                db.close();
            } else {
                var user = doc[0];
                if (!user.myBenfits || parseFloat(req.body.price) > user.myBenfits) {
                    res.send({ status: 'failed', msg: '账户余额不足' });
                    db.close();
                } else {
                    db.collection('withDraw').insertOne({
                        "openId": openId,
                        "withDrawId": "wid_" + openId + "_" + new Date().getTime(),
                        "name": req.body.name,
                        "card": req.body.card,
                        "bank": req.body.bank,
                        "price": parseFloat(req.body.price),
                        "time": day,
                        "status": 1
                    });
                    db.collection('user').updateOne({ "openId": openId }, {
                        $set: {
                            myBenfits: user.myBenfits - parseFloat(req.body.price)
                        }
                    });
                    res.send({ status: 'success' })
                    db.close();
                }
            }
        })
    })
}

var checkAdmin = function (req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('admin').find({ phoneNumber: req.body.phoneNumber }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed' })
                db.close();
            } else if (!doc || doc.length === 0) {
                res.send({ status: 'failed' })
                db.close();
            } else {
                if (doc[0].password === req.body.password) {
                    req.session.admin = {};
                    req.session.admin.phoneNumber = req.body.phoneNumber
                    res.send({ status: 'success' })
                } else {
                    res.send({ status: 'failed' })
                }
                db.close();
            }
        })
    })
}

var getWithDraw = function (req, res, isAll = false) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('withDraw').find(isAll ? {} : { openId: req.query.openId }).sort({ time: -1 }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed' })
                db.close();
            } else if (!doc || doc.length === 0) {
                if (isAll) {
                    res.send('<div></div>');
                }
                else {
                    res.send({ status: 'failed' })
                }
                db.close();
            } else {
                if (isAll) {
                    var html = viewHandler.buildAllWithDrawView(doc);
                    res.send(html)
                }
                else {
                    res.send({ status: 'success', data: doc })
                }
                db.close();
            }
        })
    })
}

var updateWithDraw = function (req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('withDraw').updateOne({ "withDrawId": req.query.withDrawId }, {
            $set: {
                "status": parseInt(req.query.status),
            },
            $currentDate: { "lastModified": true }
        });
        res.send({ status: 'success' })
    })
}

var updateOrder = function (req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('order').updateOne({ "orderId": req.query.orderId }, {
            $set: {
                "status": parseInt(req.query.status),
                "logisticsId": req.query.logisticsId || ""
            },
            $currentDate: { "lastModified": true }
        });
        res.send({ status: 'success' })
    })
}

var getUserCount = function (req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('user').find().count(function (err, count) {
            if (err) {
                res.send({ status: 'failed' })
                db.close();
            } else if (!count) {
                var html = `<div class="box-body">
                <table class="table table-bordered table-hover">
                    <thead>
                    <tr>
                        <th class="col-md-2">用户总数</th>
                        <td>0</td>
                    </tr>
                    </thead>
                </table>
            </div>`
                res.send(html)
                db.close();
            } else {
                var html = `<div class="box-body">
                <table class="table table-bordered table-hover">
                    <thead>
                    <tr>
                        <th class="col-md-2">用户总数</th>
                        <td>${count}</td>
                    </tr>
                    </thead>
                </table>
            </div>`
                res.send(html)
                db.close();
            }
        })
    })
}

module.exports.getUserClock = getUserClock;
module.exports.createUser = createUser;
module.exports.getUserInfo = getUserInfo;
module.exports.checkUserExists = checkUserExists;
module.exports.updateUser = updateUser;
module.exports.getOrder = getOrder;
module.exports.getPreLevel = getPreLevel;
module.exports.getBenfits = getBenfits;
module.exports.getClockIndex = getClockIndex;
module.exports.updateClock = updateClock;
module.exports.createOrder = createOrder;
module.exports.withDraw = withDraw;
module.exports.getWithDraw = getWithDraw;
module.exports.updateWithDraw = updateWithDraw;
module.exports.updateOrder = updateOrder;
module.exports.getUserCount = getUserCount;
module.exports.subscribeF = subscribeF;

module.exports.checkAdmin = checkAdmin;


module.exports.findUser = findUser;
module.exports.addUser = addUser;
module.exports.getUser = getUser;
module.exports.createScore = createScore;
module.exports.readCourse = readCourse;
module.exports.getRead = getRead;
module.exports.getUserTeam = getUserTeam;
module.exports.getRanking = getRanking;
module.exports.createUsersFromXlsx = createUsersFromXlsx;
module.exports.findAllUser = findAllUser;
module.exports.createScoreXlsx = createScoreXlsx;
module.exports.updateUserEmail = updateUserEmail;
// module.exports.getScore = getScore;