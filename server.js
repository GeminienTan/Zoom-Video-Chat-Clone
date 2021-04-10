const express = require('express');
const mysql = require('mysql');
const app = express();
const session = require('express-session');
const server = require('http').Server(app);
const io = require('socket.io')(server);
const bodyParser = require('body-parser');
const CryptoJS = require('crypto-js');
const { ExpressPeerServer } = require('peer');
const fileUpload = require('express-fileupload');
var flash = require('connect-flash');

// File System for loading the list of words
var fs = require('fs');

//A simple JavaScript alert manager
const JSAlert = require("js-alert");
//A JavaScript date library for parsing, validating, manipulating, and formatting dates
const moment = require('moment');

//A node.js middleware for handling multipart/form-data, which is primarily used for uploading files. 
const multer = require('multer');

const path = require('path');

const peerServer = ExpressPeerServer(server, {
  debug: true,
});
const { v4: uuidV4, validate: uuidV4Validate } = require("uuid");
//mysql

var mysqlConnection  = require('./public/lib/db');

const { holdReady } = require('jquery');

app.set("view engine", "ejs");

app.use(express.static("public"));

app.use("/peerjs", peerServer);

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: false }));

app.use(fileUpload());

app.set('trust proxy', 1) // trust first proxy

var sess = {
  secret: 'secret',
  resave: true,
  saveUninitialized: true,
  rolling: true,
  cookie: {
    httpOnly: false,
    maxAge: 6600000,
  }
}

if (app.get('env') === 'production') {
  app.set('trust proxy', 1) // trust first proxy
  sess.cookie.secure = false // serve secure cookies
}

app.use(session(sess));
app.use(flash());

var notifications;

var exists = fs.existsSync('notifications.json');
if (exists) {
  // Read the file
  console.log('loading notifications');
  var txt = fs.readFileSync('notifications.json', 'utf8');
  // Parse it  back to object
  notifications = JSON.parse(txt);
} else {
  // Otherwise start with blank list
  console.log('No notifications');
  notifications = [];
}

app.get("/", (req, res) => {
  res.render("index");
});

//when user click sign-up button
app.get("/sign-up", (req, res) => {
  res.render("sign-up");
});

app.get("/admin", (req, res) => {
  res.render(path.join(__dirname , 'views' ,'admin/sign-in'));
});

app.get("/admin/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/admin");
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

app.get("/feedback", (req, res) => {
  res.render("feedback");
});

app.get("/claimRewards/:u_name&:points", (req, res) => {
  res.render("claimRewards",{user:req.params.u_name,points:req.params.points});
});

app.post("/admin/sign-in", (req, res) => {
  const email = req.body.ad_email;
  const key = req.body.adminKey;
  const password = CryptoJS.MD5(req.body.password);
  let sql = "SELECT * from admin WHERE ad_email =? AND ad_key= ? AND ad_password=? ";
  
  let query = mysqlConnection.query(sql,[email,key,password.toString()],(err, rows) => {
    if(err) throw err;
    if(rows==0){
      
      res.redirect("back");
    }
    rows.forEach((row) => {
      const ad_id = row.ad_id;
      req.session.ad_id = ad_id;
      req.session.save();
      res.redirect('/admin/dashboard');
      
    });
  });
});

app.get("/admin/dashboard", (req, res) => {
  if(!req.session.ad_id) {
    res.redirect('/admin');
  }
  else{
  const ad_id = req.session.ad_id;

  res.render((__dirname + '/views/admin/dashboard'),{
    ad_id:ad_id,
    moment: moment,
  });
  }
});

app.get("/admin/getUserDataByGender", (req, res) => {
  var data= [];
  let sql = "SELECT u_gender as gender, COUNT(*) as count FROM user GROUP BY u_gender";
    let query = mysqlConnection.query(sql,(err, rows) => {
    if(err) throw err;
    rows.forEach((row) => {
      record={
        gender:row.gender,
        count:row.count
      }
      data.push(record);
    });
    res.send(JSON.stringify(data));
    });
});

app.get("/admin/getUserDataByAgeGroup", (req, res) => {
  var data= [];

  let sql = "SELECT count(u_id) AS count , CASE WHEN datediff(now(), u_dob) / 365.25 >= 65 THEN '65 years and over' WHEN datediff(now(), u_dob) / 365.25 >= 55 THEN '55-64' WHEN datediff(now(), u_dob) / 365.25 >= 25 THEN '25-54' WHEN datediff(now(), u_dob) / 365.25 > 15 THEN '15-24' ELSE '0-14' END AS age_group FROM user GROUP BY age_group ";
    let query = mysqlConnection.query(sql,(err, rows) => {
    if(err) throw err;
    rows.forEach((row) => {
      record={
        age_group:row.age_group,
        count:row.count
      }
      data.push(record);
    });
    res.send(JSON.stringify(data));
    });
});

app.get("/admin/getAllUser", (req, res) => {
  if(!req.session.ad_id) {
    res.redirect('/admin');
  }
  let sql = "SELECT u_id,u_name,u_gender,u_dob,u_phone,u_email,u_point,u_status,u_register_date FROM user";
  let query = mysqlConnection.query(sql,(err, results) => {
    if(err) throw err;
    res.render(path.join(__dirname , 'views' ,'admin/user-list'),{ moment:moment,user:results} );
   
  });
  
});

app.get("/admin/getAllGuest", (req, res) => {
  if(!req.session.ad_id) {
    res.redirect('/admin');
  }
  let sql = "SELECT * FROM guest";
  let query = mysqlConnection.query(sql,(err, results) => {
    if(err) throw err;
    res.render(path.join(__dirname , 'views' ,'admin/guest-list'),{ moment:moment,guest:results} );
  });
  
});

app.get("/admin/getAllAdmin", (req, res) => {
  if(!req.session.ad_id) {
    res.redirect('/admin');
  }
  let sql = "SELECT * FROM admin";
  let query = mysqlConnection.query(sql,(err, results) => {
    if(err) throw err;
    res.render(path.join(__dirname , 'views' ,'admin/admin-list'),{ moment:moment,admin:results} );
  });
});

app.get("/admin/getAllFeedback", (req, res) => {
  if(!req.session.ad_id) {
    res.redirect('/admin');
  }
  var queries = [
    "SELECT AVG(f_star) AS averageStar FROM feedback",
    "SELECT f_comment,f_star,f_date FROM feedback WHERE f_comment IS NOT NULL",
    "SELECT f_star,COUNT(*) AS Count FROM feedback GROUP BY f_star",
  ];

  mysqlConnection.query(queries.join(';'),(err, results, fields) => {

    if (err) throw err;
    res.render('admin/feedback-list', {
      moment:moment,
      averageStar: results[0],
      feedback : results[1],
      count: results[2],
    });

  });
});

app.post("/admin/addAdmin", (req, res) => {

  const ad_password = CryptoJS.MD5(req.body.password);
  let data = {ad_name: req.body.name,ad_key: req.body.key,ad_email: req.body.email,ad_password: ad_password.toString(),ad_status:'A'};
   let sql = "INSERT INTO admin SET ?";
    let query = mysqlConnection.query(sql, data,(err, results) => {
    if(err) throw err;
    res.redirect("back");
    });
});

//when user submit form to sign up 
app.post('/sign-up',(req, res) => {
  let current_time = moment().format("YYYY-MM-DD HH:mm:ss");
  const u_fname = req.body.fname;
  const u_lname = req.body.lname;
  const u_name = u_fname +" "+ u_lname;
  const u_password = CryptoJS.MD5(req.body.password);
  let data = {u_name: u_name,u_gender: req.body.gender,u_dob: req.body.birthday,u_phone: req.body.phone,u_email: req.body.email,u_password: u_password.toString(),u_profilepic: "dist/img/avatars/avatar-default.jpg",u_point:0,u_status:'A',u_register_date:current_time};
   let sql = "INSERT INTO user SET ?";
    let query = mysqlConnection.query(sql, data,(err, results) => {
    if(err) throw err;
    res.render('index', { message:"success" });
    });
});

//when user submit form to sign up 
app.post('/loginGoogle',(req, res) => {
  let current_time = moment().format("YYYY-MM-DD HH:mm:ss");
  const name = req.body.u_name;
  const email = req.body.u_email;
  const profilepic = req.body.u_profilepic;
  const password = req.body.token;
  let data = {u_name: name,u_email: email,u_password: password,u_profilepic:profilepic,u_point:0,u_status:'A',u_register_date:current_time};
  
  let sql1 = "SELECT * from user WHERE u_email= ? AND u_password=? ";
  
  let query1 = mysqlConnection.query(sql1,[email,password],(err, rows) => {
    if(err) throw err;

    if(rows==0){

      let sql = "INSERT INTO user SET ?";
      let query = mysqlConnection.query(sql, data,(err, results) => {
      if(err) throw err;
        const u_id = results.insertId;
        const u_name = name;
        req.session.u_id = u_id;
        req.session.u_name = u_name;
        req.session.save();
        res.json({msg:'success'})
      });
      
    }
    rows.forEach((row) => {
      console.log(row.u_id);
      const u_id = row.u_id;
      const u_name = row.u_name;
      req.session.u_id = u_id;
      req.session.u_name = u_name;
      req.session.save();
      res.json({msg:'success'})
      //res.redirect('/home');
      //res.send({message:"success"})
      
    });
  });
});

//when user submit form to sign in 
app.post('/home',(req, res) => {
  const u_email = req.body.email;
  const u_password = CryptoJS.MD5(req.body.password);
  let sql1 = "SELECT * from user WHERE u_email= ? AND u_password=? ";
  
  let query1 = mysqlConnection.query(sql1,[u_email,u_password.toString()],(err, rows) => {
    if(err) throw err;
    if(rows==0){
      res.render('index', { message:"error" });
    }
    rows.forEach((row) => {
      const u_id = row.u_id;
      const u_name = row.u_name;
      req.session.u_id = u_id;
      req.session.u_name = u_name;
      req.session.save();
      res.redirect('/home');
      
    });
  });
});

app.get("/home",(req,res) =>{
  if(!req.session.u_id) {
    res.redirect('/');
  }
  else{
  const u_id = req.session.u_id;
  const u_name = req.session.u_name;
  var queries = [
        "SELECT ct_id,user.u_id,u_name,u_profilepic,u_status,u_email FROM user INNER JOIN contact ON (contact.ct_email = user.u_email) WHERE contact.u_id =? AND contact.ct_status = 'A'",
        "SELECT DISTINCT room.r_id as r_id,c_title,c_desc,c_id FROM room LEFT JOIN room_record ON (room.r_id = room_record.r_id) INNER JOIN channel ON (channel.r_id = room.r_id) WHERE room_record.u_id=? OR room.r_owner_id =? AND room.r_status = 'A' AND channel.c_status ='A'",
        "SELECT DISTINCT room.r_id as r_id,r_title,r_desc,r_status,u_name as owner_name ,u_profilepic as owner_profilepic,user.u_id as owner_id FROM room LEFT JOIN room_record ON (room.r_id = room_record.r_id AND room_record.rr_status = 'A') INNER JOIN user ON (room.r_owner_id = user.u_id) WHERE room_record.u_id= ? OR room.r_owner_id =? AND room.r_status = 'A' ",
        "SELECT rr_id,room_record.r_id as r_id,user.u_name as u_name,user.u_profilepic as u_profilepic FROM room_record INNER JOIN user ON (user.u_id = room_record.u_id) WHERE rr_status='A'",
        "SELECT schedule.*, user.u_name as owner_name FROM schedule INNER JOIN user ON (user.u_id = schedule.u_id) WHERE s_status = 'A' AND schedule.u_id=?",
        "SELECT s_id,user.u_name as u_name FROM attendees INNER JOIN user ON (user.u_id = attendees.u_id)",
        "SELECT schedule.s_id as s_id, user.u_name as presenter,a_id,a_topic,a_time_allocated FROM agenda INNER JOIN schedule ON (schedule.s_id = agenda.s_id) INNER JOIN user ON (agenda.a_presenter = user.u_id) WHERE a_status = 'A'",
        "SELECT * FROM user WHERE u_id=?",
        "SELECT u1.u_name as sender_name, u2.u_name as receiver_name, u1.u_id as sender_id, u2.u_id as receiver_id,  u1.u_profilepic as sender_profilepic, u2.u_profilepic as receiver_profilepic, u1.u_status as sender_status, u2.u_status as receiver_status, cv_id FROM conversation INNER JOIN user u1 ON(u1.u_id = conversation.cv_sender) INNER JOIN user u2 ON(u2.u_id = conversation.cv_receiver) WHERE cv_sender = ? or cv_receiver = ?",
        "SELECT u1.u_name as sender_name, u2.u_name as receiver_name, u1.u_id as sender_id, u2.u_id as receiver_id, u1.u_profilepic as sender_profilepic, u2.u_profilepic as receiver_profilepic,cm_content,cm_datetime,cm_file,chat_message.cv_id as cv_id FROM chat_message INNER JOIN user u1 ON(u1.u_id = chat_message.cm_sender) INNER JOIN user u2 ON(u2.u_id = chat_message.cm_receiver) WHERE chat_message.cm_status = 'A' AND cm_sender=? OR cm_receiver=?  ORDER BY cm_datetime ASC ",
        "SELECT user.u_id as sender_id, user.u_name as sender_name, user.u_profilepic as sender_profilepic, ch_id, ch_content, ch_file, c_id, ch_datetime from channel_message INNER JOIN user ON (user.u_id = channel_message.ch_sender_id) WHERE ch_status='A' ORDER BY ch_datetime ASC",
        "SELECT * from meeting WHERE m_etime IS NULL AND m_owner_id !=?",
      ];
    
      mysqlConnection.query(queries.join(';'),[u_id,u_id,u_id,u_id,u_id,u_id,u_id,u_id,u_id,u_id,u_id,u_id],(err, results, fields) => {
    
        if (err) throw err;

        req.session.contact = results[0];
        req.session.channel = results[1];
        req.session.room = results[2];
        req.session.member = results[3];
        req.session.schedule = results[4];
        req.session.attendees = results[5];
        req.session.agenda = results[6];
        req.session.account =results[7];
        req.session.conversation = results[8];
        req.session.message = results[9];
        req.session.channel_message = results[10];
        req.session.meeting = results[11];
        req.session.save();

        res.render('home', {
          u_id:u_id,
          u_name:u_name,
          moment: moment,
          notifications:notifications,
          contact: req.session.contact,
          channel: req.session.channel, 
          room: req.session.room,
          member:req.session.member,
          schedule: req.session.schedule,
          attendees: req.session.attendees,
          agenda: req.session.agenda,
          account:req.session.account,
          conversation:req.session.conversation,
          message:req.session.message,
          channel_message:req.session.channel_message,
          meeting:req.session.meeting,
          alertMessage: req.flash('info'),
          errorMessage:req.flash('danger')
        });
      });
    }
    
});


//when user submit form to addRoom 
app.post('/addRoom',(req, res) => {
  let roomData = {r_title: req.body.r_title, r_desc: req.body.r_desc,r_status:'A',r_owner_id: req.body.owner_id};
  let channelData = {c_title: req.body.c_title, c_desc: req.body.c_desc,c_status:'A'};
  let attendees = req.body.c_attendees;
  let sql1 = "INSERT INTO room SET ?";
  let query1 = mysqlConnection.query(sql1, roomData,(err, results) => {
    if(err) throw err;
    const r_id = results.insertId;

    let sql2 = "INSERT INTO channel SET ?,r_id=? ";
    let query2 = mysqlConnection.query(sql2, [channelData,r_id],(err2, results2) => {
      if(err2) throw err2;
    });

    const attendeesIsArray = Array.isArray(attendees);
    if (attendeesIsArray == true){
      for($i=0;$i<attendees.length;$i++) {
        
        if(attendees[$i] != '')
        {
          let sql3 = "INSERT INTO room_record SET r_id=?, u_id= (SELECT u_id FROM user WHERE u_name = ? ), rr_status='A'";
          let query3 = mysqlConnection.query(sql3,[r_id,attendees[$i]] ,(err3, results3) => {
            if(err3) throw err3;
            generateNotification(r_id,attendees);
          });
        }
      }  
    }
    else{
      let sql4 = "INSERT INTO room_record SET r_id=?, u_id= (SELECT u_id FROM user WHERE u_name = ? ), rr_status='A'";
      let query4 = mysqlConnection.query(sql4,[r_id,attendees] ,(err4, results4) => {
        if(err4) throw err4;
        generateNotification(r_id,attendees);
      });
    }
    
    

  });
  req.flash('info', 'Room created successfully!' );
  req.session.save();
  res.redirect("home");

});

//when user submit form to addRoom 
app.post('/addChannel',(req, res) => {
  let r_id= req.body.room_id;
  let channelData = {c_title: req.body.c_title, c_desc: req.body.c_desc,c_status:'A'};
  
    let sql1 = "INSERT INTO channel SET ?,r_id=?";
    let query1 = mysqlConnection.query(sql1, [channelData,r_id],(err1, results1) => {
      if(err1) throw err1;
      console.log("Insert Channel Successfully!");
    });
    res.redirect("home");
});

//when user submit feedback form 
app.post('/submitFeedback',(req, res) => {
  let current_time = moment().format("YYYY-MM-DD HH:mm:ss");
  const comment= req.body.comment;
  const star= req.body.star;
  let feedbackData= {f_comment:comment,f_star:star,f_date:current_time};
  let sql = "INSERT INTO feedback SET ?";
  let query = mysqlConnection.query(sql, [feedbackData],(err, results1) => {
    if(err) throw err;
    console.log("Insert Feedback");
  });
  res.redirect("home");
});

app.post('/addMember',(req, res) => {
  let r_id = req.body.room_id;
  let attendees = req.body.c_attendees;
  const attendeesIsArray = Array.isArray(attendees);
    if (attendeesIsArray == true){
      for($i=0;$i<attendees.length;$i++) {
        
        if(attendees[$i] != '')
        {
          let sql1 = "INSERT INTO room_record SET r_id=?, u_id= (SELECT u_id FROM user WHERE u_name = ? ), rr_status='A'";
          let query1 = mysqlConnection.query(sql1,[r_id,attendees[$i]],(err1, results1) => {
            if(err1) throw err1;
            
          });
        }
      }  
    }
    else{
      let sql2 = "INSERT INTO room_record SET r_id=?, u_id= (SELECT u_id FROM user WHERE u_name = ?), rr_status='A'";
      let query2 = mysqlConnection.query(sql2,[r_id,attendees],(err2, results2) => {
        if(err2) throw err2;
      });
    }
    generateNotification(r_id,attendees);
    res.redirect("/home");

});

app.post('/addContact',(req, res) => {
  var ct_email = req.body.ct_email;
  var u_id = req.body.u_id;

  //check if email is same like the email of the user
  let sql1 = "SELECT u_email FROM user WHERE u_id = ?";
  let query1 = mysqlConnection.query(sql1, [u_id],(err1, rows) => {
    if(err1) throw err1;
    rows.forEach((row) => {
      if(ct_email == row.u_email){
        req.flash('danger', 'You cannot add yourself into contact list' );
        res.redirect("back");
      }
      else{
          //check if the contact is already exist
          let sql2 = "SELECT * FROM contact WHERE ct_email=? AND u_id = ?";
          let query2 = mysqlConnection.query(sql2, [ct_email,u_id],(err2, rows2) => {
            if(err2) throw err2;
            if(rows2 !=0){
              req.flash('danger', 'Contact already exist!' );
              res.redirect("back");
            }
            //check if the email is exist
            else{
                let sql3 = "SELECT * FROM user WHERE u_email=?";
                let query3 = mysqlConnection.query(sql3, [ct_email],(err3, rows3) => {
                  if(err3) throw err3;
                  if(rows3==0){
                    req.flash('danger', 'This email is not a registered email' );
                    res.redirect("back");
                  }
                  else{
                    let data = {ct_email: ct_email, u_id:u_id ,ct_status:'A'};
                    let sql = "INSERT INTO contact SET ?";
                    let query = mysqlConnection.query(sql, data,(err, results) => {
                      if(err) throw err;
                      req.flash('info', 'Insert Contact Successfully!' );
                      res.redirect("back");

                    });
                  }  
              })
            }
          })
        }
    })
  })

});

app.post('/addChat',(req, res) => {
  let filePath;
  let current_time = moment().format("YYYY-MM-DD HH:mm:ss");
  var cv_sender = req.body.sender;
  var sender_name = req.body.u_name;
  var cv_id = parseInt(req.body.cv_id);

  if (!req.files || Object.keys(req.files).length === 0) {
    filePath = null;
  }
  else{
    let sampleFile = req.files.chatFile;
    filePath= 'dist/file/' + sampleFile.name;
    uploadFile(sampleFile);
  }

  if (isNaN(cv_id) == true){
      let sql1 = "SELECT u_id FROM user WHERE u_name =?";
      let query1 = mysqlConnection.query(sql1,req.body.receiver ,(err, rows) => {
        if(err) throw err;
        rows.forEach((row) => {
          var cv_receiver = row.u_id;
          let chatData = {cm_content: req.body.content,cm_file:null,cm_datetime:current_time,cm_receiver: cv_receiver,cm_sender: cv_sender,cm_status: 'A'};
          
          var notificationContent = {
            "notification":"send you a new message.",
            "from":sender_name,
            "u_id":[cv_receiver],
            "date":current_time,
            "status":"unread",
            "type":"chat"
          };

          //create conversation
          let sql2 = "SELECT cv_id FROM conversation WHERE (cv_receiver=? AND cv_sender=?) OR (cv_sender=? AND cv_receiver=?)";
          let query2 = mysqlConnection.query(sql2,[cv_receiver,cv_sender,cv_receiver,cv_sender] ,(err2, rows) => {
            if(err2) throw err2;
            if(rows==0){
              console.log("New conversation");
              let sql3 = "INSERT into conversation SET cv_receiver=?,cv_sender=?";
              let query3 = mysqlConnection.query(sql3,[cv_receiver,cv_sender] ,(err3, results) => {
                if(err3) throw err3;
                const cv_id = results.insertId;
                console.log("Insert conversation successfully");
                
                let sql4 = "INSERT into chat_message SET ? , cv_id=?";
                let query4 = mysqlConnection.query(sql4,[chatData,cv_id],(err4, results) => {
                  if(err4) throw err4;
                  console.log("Insert message successfully with new conver");
                  addNotification(notificationContent);
                });
              });
            }
            rows.forEach((row) => {
              cv_id = row.cv_id;
              let sql5 = "INSERT into chat_message SET ? , cv_id= ?";
                let query5 = mysqlConnection.query(sql5,[chatData,cv_id],(err5, results4) => {
                  if(err5) throw err5;
                  console.log("Insert message successfully with old conver");
                  addNotification(notificationContent);
                  res.redirect('/home');
            });

            });
          });
        });
      });
  }
  else{
    var cv_receiver = parseInt(req.body.receiver);
    var cv_sender = parseInt(req.body.sender);
    var notificationContent = {
      "notification":"send you a new message",
      "from":sender_name,
      "u_id":[cv_receiver],
      "date":current_time,
      "status":"unread",
      "type":"chat"
    };

    let chatData = {cm_content: req.body.content,cm_file:filePath,cm_datetime:current_time,cm_receiver: cv_receiver,cm_sender: cv_sender,cv_id:cv_id,cm_status: 'A'};
    let sql6 = "INSERT into chat_message SET ?";
            let query6 = mysqlConnection.query(sql6,[chatData,cv_id],(err6, results) => {
              if(err6) throw err6;
              console.log("Insert message successfully with old conver");
              addNotification(notificationContent);
              res.redirect('/home');

            });
    console.log(chatData);
  }
});

//when user submit form to add Schedule 
app.post('/addSchedule',(req, res) => {
  let scheduleData = {s_title: req.body.s_title, s_objective: req.body.s_objective,s_status:'A',s_date: req.body.s_date,s_stime: req.body.s_stime,s_etime: req.body.s_etime,u_id:req.body.owner_id};
  let attendees = req.body.s_attendees;

  let sql1 = "INSERT INTO schedule SET ?";
  let query1 = mysqlConnection.query(sql1, scheduleData,(err, results) => {
    if(err) throw err;
    const s_id = results.insertId;
    console.log("Insert Schedule Successfully");

    for($i=0;$i<attendees.length;$i++) {

      if(attendees[$i] != '')
      {
        let sql2 = "INSERT INTO attendees SET u_id=(SELECT u_id FROM user WHERE u_name = ? ),s_id=?";
        let query2 = mysqlConnection.query(sql2,[attendees[$i],s_id],(err2, results2) => {
          if(err2) throw err2;
          req.flash('info', 'Insert Schedule Successfully!' );
          res.redirect("back");
        });
      }
    }
  });

});

app.post('/editAgenda',(req, res) => {
  var a_id =  parseInt(req.body.id);
  var column_name = req.body.column_name;
  var value = req.body.value;
  var sql;

  if(column_name == "a_topic"){
    sql = "UPDATE agenda SET a_topic = ? where a_id = ?";
  }else if(column_name == "a_presenter"){
    sql = "UPDATE agenda SET a_presenter = (SELECT u_id FROM user WHERE u_name = ?)  where a_id = ?";
  }else if(column_name == "a_time"){
    value = parseInt(value);
    sql = "UPDATE agenda SET a_time_allocated = ? where a_id = ?";
  }
  //console.log(value);
  let query = mysqlConnection.query(sql,[value,a_id],(err, results) => {
    if(err){  
      res.json({msg:'error'});  
    }else{  
      res.json({msg:'success'});  
    }
    
  });
});

app.post('/editSchedule',(req, res) => {
  var s_id =  parseInt(req.body.id);
  var column_name = req.body.column_name;
  var value = req.body.value;
  var sql;

  if(column_name == "s_title"){
    sql = "UPDATE schedule SET s_title = ? where s_id = ?";
  }else if(column_name == "s_date"){
    sql = "UPDATE schedule SET s_date = ? where s_id = ?";
  }else if(column_name == "s_stime"){
    sql = "UPDATE schedule SET s_stime = ? where s_id = ?";
  }else if(column_name == "s_etime"){
    sql = "UPDATE schedule SET s_etime = ? where s_id = ?";
  }else if(column_name == "s_objective"){
    sql = "UPDATE schedule SET s_objective = ? where s_id = ?";
  }
  
  let query = mysqlConnection.query(sql,[value,s_id],(err, results) => {
    if(err){  
      res.json({msg:'error'});  
    }else{  
      res.json({msg:'success'});  
    }
  });
});

app.post('/addAgenda',(req, res) => {
  let s_id = parseInt(req.body.s_id);
  let presenter_name = req.body.a_presenter;
  let agendaData = {s_id:parseInt(req.body.s_id),a_topic:req.body.a_topic,a_time_allocated:req.body.a_time_allocated,a_status:'A'};
  
  console.log(agendaData);
  console.log(presenter_name);
  let sql = "INSERT INTO agenda SET ?, a_presenter = (SELECT u_id FROM user WHERE u_name = ? ) ";
  let query = mysqlConnection.query(sql,[agendaData,presenter_name],(err, results) => {
    const a_id = results.insertId;
    if(err){  
      res.json({msg:'error'});  
    }else{  
      res.json({msg:'success',data:a_id});  
    }
    
  });
});

//when user submit form to edit Profile
app.post('/editProfile',(req, res) => {
  let u_id = parseInt(req.body.u_id);
  let profileData = {u_name: req.body.u_name,u_gender: req.body.u_gender,u_dob: req.body.u_dob,u_phone: req.body.u_phone,u_email: req.body.u_email};
  console.log(profileData);
  let sql = "UPDATE user SET ? where u_id = ?";
    let query = mysqlConnection.query(sql,[profileData,u_id],(err, results) => {
      if(err) throw err;
      req.flash('info', 'Update Profile Successfully!' );
      res.redirect("home");
    });
});

//when user submit form to edit Profile
app.post('/changeProfilePic',(req, res) => {
  let u_id = parseInt(req.body.u_id);
  
  let filePath;
  
  if (!req.files || Object.keys(req.files).length === 0) {
    filePath = null;
    req.flash('danger', 'No image selected' );
    res.redirect("home");
  }
  else{
    let sampleFile = req.files.u_profilepic;
    filePath= 'dist/img/avatars/' + sampleFile.name;
    uploadImage(sampleFile);
    let sql = "UPDATE user SET u_profilepic = ? where u_id = ?";
    let query = mysqlConnection.query(sql,[filePath,u_id],(err, results) => {
      if(err) throw err;
      req.flash('info', 'Change Profile Picture Successfully!' );
      res.redirect("home");
    });
  }
});

//when user submit form to addRoom 
app.post('/editPassword',(req, res) => {
  let u_id = parseInt(req.body.u_id);
  let old_password = CryptoJS.MD5(req.body.old_pwd);
  let password = CryptoJS.MD5(req.body.password);

  let sql = "SELECT * FROM user where u_id = ?";
    let query = mysqlConnection.query(sql,u_id,(err, rows) => {
      if(err) throw err;
      //res.redirect("home");
      rows.forEach((row) => {
        if (old_password.toString() == row.u_password) {
          let sql2 = "UPDATE user SET u_password =? WHERE u_id=?";
            let query2 = mysqlConnection.query(sql2,[password.toString(),u_id],(err2, results) => {
              if(err2) throw err2;
              req.flash('info', 'Insert Schedule Successfully!' );
              res.status(200).send({ success: true });
            });
        }
        else{
          req.flash('danger', 'Current password entered is incorrect!' );
          res.redirect("home");
        }
      });
    });
});

app.get("/createMeeting/:u_id&:m_type&:id&:cameraOn", (req, res) => {
  let u_id = parseInt(req.params.u_id);
  let current_time = moment().format("YYYY-MM-DD HH:mm:ss");
  const room= uuidV4(); 
  const id = parseInt(req.params.id); 
  const cameraOn = req.params.cameraOn;
  const m_type = req.params.m_type; 
  var meetingData,mp_type,type;

  if(cameraOn == false){
    mp_type = "audio";
    type = "ring_volume";
  }
  else{
    mp_type = "video";
    type = "video_call";
  }
  var notificationContent;
  var from;
  var to; 
  if(m_type == "conversation"){
    meetingData ={ m_stime:current_time,m_owner_id:u_id,m_code:room,cv_id:id};
    
    /*for notification purpose */
    let sql = "SELECT u1.u_name as username1,u2.u_name as username2, u1.u_id as userid1, u2.u_id as userid2 from conversation cv INNER JOIN user u1 ON (u1.u_id = cv.cv_sender) INNER JOIN user u2 ON (u2.u_id = cv.cv_receiver) WHERE cv_id=? ";
    let query = mysqlConnection.query(sql, [id],(err, rows) => {
    if(err) throw err;

      rows.forEach((row) => {
        if(u_id == row.userid1){
          from = row.username1;
          to = row.userid2;
        }else if(u_id == row.userid2){
          from = row.username2;
          to = row.userid1;
        }
        notificationContent = {
        "notification":"is calling you",
        "from":from,
        "u_id":to,
        "date":current_time,
        "status":"unread",
        "type":type,
        };
        console.log(notificationContent);
        addNotification(notificationContent);
      });
    });
    
  }
  else if (m_type == "channel"){
    meetingData ={m_stime:current_time,m_owner_id:u_id,m_code:room,c_id:id};
    var toList = [];
    var notis;
    /*for notification purpose */
    let sql = "SELECT DISTINCT room.r_id as r_id,r_title, c_title,c_desc,c_id, u1.u_id as userid, u1.u_name as username, room.r_owner_id, u2.u_name as ownername FROM (room INNER JOIN user u2 ON (room.r_owner_id = u2.u_id)) LEFT JOIN room_record ON (room.r_id = room_record.r_id) INNER JOIN user u1 on (room_record.u_id = u1.u_id) INNER JOIN channel ON (channel.r_id = room.r_id) WHERE channel.c_id = ? AND room_record.rr_status ='A'";
    let query = mysqlConnection.query(sql, [id],(err, rows) => {
    if(err) throw err;

      rows.forEach((row) => {
        var venue = row.r_title + " " + row.c_title;
        notis = "has just start a meeting at "+venue;
        if(u_id == row.r_owner_id){
          from = row.ownername;
        }
        if(u_id == row.userid){
          from = row.username;
          toList.push(row.r_owner_id);
        }
        else if(u_id != row.userid) {
          toList.push(row.userid);
        }
        
      });
      notificationContent = {
        "notification":notis,
        "from":from,
        "u_id":toList,
        "date":current_time,
        "status":"unread",
        "type":"video_call",
        };
      console.log(notificationContent);
      addNotification(notificationContent);
    });
  }

  let sql = "UPDATE user set u_point = u_point + 2 WHERE u_id =? ";
  let query = mysqlConnection.query(sql, u_id,(err, results) => {
    if(err) throw err;
  });

  let sql1 = "INSERT INTO meeting SET ?";
  let query1 = mysqlConnection.query(sql1, meetingData,(err, results) => {
    if(err) throw err;
    const m_id = results.insertId;
    console.log("Insert Meeting Successfully");
    
    let participantData ={mp_u_id:u_id,mp_join_time:current_time,mp_type:mp_type};
    let sql2 = "INSERT INTO meeting_participant SET ?,m_id=?";
    let query2 = mysqlConnection.query(sql2,[participantData,m_id],(err2, results2) => {
      if(err2) throw err2;
      console.log("Insert Participant Successfully");
      
      res.redirect(`/${room}`);
    });
  });
});

app.get("/deleteChannel/:channel_id", (req, res) => {
  const c_id = parseInt(req.params.channel_id); 
  let sql = "UPDATE channel SET c_status='I' WHERE c_id ="+c_id;
  let query = mysqlConnection.query(sql,(err, results) => {
    if(err) throw err;
    req.flash('info', 'Delete Channel Successfully!' );
    res.redirect('back');
  });
});

app.get("/deleteRoom/:room_id", (req, res) => {
  const r_id = parseInt(req.params.room_id); 
  let sql = "UPDATE room SET r_status='I' WHERE r_id ="+r_id;
  let query = mysqlConnection.query(sql,(err, results) => {
    if(err) throw err;
    req.flash('info', 'Delete Room Successfully!' );
    res.redirect('back');
  });
});

app.get("/clearHistory/:c_id", (req, res) => {
  const channel_id = parseInt(req.params.c_id);
  let sql1 = "SELECT ch_id FROM channel_message WHERE c_id ="+channel_id;
  let query1 = mysqlConnection.query(sql1,(err1, rows) => {
    if(err1) throw err1;

  rows.forEach((row) => {
    let sql2 = "UPDATE channel_message SET ch_status='I' WHERE ch_id=?";
      let query2 = mysqlConnection.query(sql2,row.ch_id,(err2, results) => {
        if(err2) throw err2;
        req.flash('info', 'Clear History Successfully!' );
        res.redirect('back');
      });
  });
    
  });
});

app.get("/clearChat/:cv_id", (req, res) => {
  const cv_id = parseInt(req.params.cv_id);
  let sql1 = "SELECT cm_id FROM conversation INNER JOIN chat_message ON (chat_message.cv_id = conversation.cv_id)  WHERE conversation.cv_id ="+cv_id;
  let query1 = mysqlConnection.query(sql1,(err1, rows) => {
    if(err1) throw err1;

  rows.forEach((row) => {
    let sql2 = "UPDATE chat_message SET cm_status='I' WHERE cm_id=?";
      let query2 = mysqlConnection.query(sql2,row.cm_id,(err2, results) => {
        if(err2) throw err2;
        req.flash('info', 'Clear Chat History Successfully!' );
      });
      
  });
  res.redirect('/home');
    
  });
  
});

app.get("/deleteMember/:room_record_id", (req, res) => {
  const rr_id = parseInt(req.params.room_record_id); 
  let sql = "UPDATE room_record SET rr_status='I' WHERE rr_id ="+rr_id;
  let query = mysqlConnection.query(sql,(err, results) => {
    if(err) throw err;
    req.flash('info', 'Delete Member Successfully' );
    res.redirect('back');
  });
});

app.get("/leaveRoom/:r_id&:u_id", (req, res) => {
  const r_id = parseInt(req.params.r_id);
  const u_id = parseInt(req.params.u_id); 
  let sql = "UPDATE room_record SET rr_status='I' WHERE r_id =? AND u_id=?";
  let query = mysqlConnection.query(sql,[r_id,u_id],(err, results) => {
    if(err) throw err;
    req.flash('info', 'Leave Room Successfully' );
    res.redirect('back');
  });
});

app.get("/deleteContact/:contact_id", (req, res) => {
  const ct_id = parseInt(req.params.contact_id); 
  let sql = "UPDATE contact SET ct_status='I' WHERE ct_id ="+ct_id;
  let query = mysqlConnection.query(sql,(err, results) => {
    if(err) throw err;
    req.flash('info', 'Delete Contact Successfully' );
    res.redirect('back');
  });
});

app.get("/deleteAccount/:u_id", (req, res) => {
  const u_id = parseInt(req.params.u_id); 
  let sql = "UPDATE user SET u_status='I' WHERE u_id ="+u_id;
  let query = mysqlConnection.query(sql,(err, results) => {
    if(err) throw err;
    req.session.alertMessage="Account deleted successfully";
    res.redirect('/');
  });
});

app.get("/deleteUser/:u_id", (req, res) => {
  const u_id = parseInt(req.params.u_id); 
  let sql = "UPDATE user SET u_status='I' WHERE u_id ="+u_id;
  let query = mysqlConnection.query(sql,(err, results) => {
    if(err) throw err;
    req.flash('info', 'Delete User Successfully' );
    res.redirect('back');
  });
});

app.get("/deleteAdmin/:u_id", (req, res) => {
  const ad_id = parseInt(req.params.u_id); 
  let sql = "UPDATE admin SET ad_status='I' WHERE ad_id ="+ad_id;
  let query = mysqlConnection.query(sql,(err, results) => {
    if(err) throw err;
    req.flash('info', 'Delete Admin Successfully' );
    res.redirect('back');
  });
});

app.get("/deleteSchedule/:s_id", (req, res) => {
  const s_id = parseInt(req.params.s_id); 
  let sql = "UPDATE schedule SET s_status='I' WHERE s_id ="+s_id;
  let query = mysqlConnection.query(sql,(err, results) => {
    if(err) throw err;
    req.flash('info', 'Delete Schedule Successfully' );
    res.redirect('back');
  });
});

app.get("/deleteAgenda/:a_id", (req, res) => {
  const a_id = parseInt(req.params.a_id); 
  let sql = "UPDATE agenda SET a_status='I' WHERE a_id ="+a_id;
  let query = mysqlConnection.query(sql,(err, results) => {
    if(err) throw err;
    req.flash('info', 'Delete Agenda Successfully' );
    res.redirect('back');
  });
});

app.get("/validateName/:roomName", (req, res) => {
  res.status(200).json({ valid: uuidV4Validate(req.params.roomName) });
});

app.get("/joinMeeting/:u_id&:meetingId&:meetingCode", (req, res) => {
  let u_id = parseInt(req.params.u_id);
  let current_time = moment().format("YYYY-MM-DD HH:mm:ss");
  const meetingId = req.params.meetingId; 
  const room = req.params.meetingCode;

  let participantData ={mp_u_id:u_id,mp_join_time:current_time,m_id:meetingId,mp_type:'audio'};
  let sql = "INSERT INTO meeting_participant SET ?";
  let query = mysqlConnection.query(sql,participantData,(err, results) => {
    if(err) throw err2;
    console.log("Insert Participant Successfully");
  });

  res.redirect(`/${room}`);

});

app.get("/joinGuestMeeting/:meetingCode", (req, res) => {
  
  const meetingCode = req.params.meetingCode;
  console.log(meetingCode);

  let sql = "SELECT m_id FROM meeting where m_code = ?";
    let query = mysqlConnection.query(sql,meetingCode,(err, rows) => {
      rows.forEach((row) => {
        const m_id = row.m_id;

       res.render(__dirname + '/views/guest/join-room',{
        roomId:meetingCode,
        m_id:m_id
      }); 

    });
  });

});

app.post('/JoinGuestMeeting/addGuest',(req, res) => {

  let current_time = moment().format("YYYY-MM-DD HH:mm:ss");
  const room = req.body.roomId; 
  const cameraOn = req.body.cameraOn;
  var mp_type;
  if (cameraOn == "true"){
    mp_type ="video"
  }
  else{
    mp_type ="audeo"
  }
  var g_id;
  let guestData = {g_name: req.body.name, g_gender:req.body.gender,g_date:current_time};
    let sql1 = "INSERT INTO guest SET ?";
    let query1 = mysqlConnection.query(sql1, guestData,(err1, results) => {
      if(err1) throw err1;
      g_id = results.insertId;
      req.session.g_id = g_id;
      req.session.save();

    let participantData = {mp_join_time:current_time,m_id:req.body.m_id,mp_type:mp_type};
    let sql2 = "INSERT into meeting_participant SET ? , mp_guest_id=?";
    let query = mysqlConnection.query(sql2, [participantData,g_id],(err, results) => {
      if(err) throw err;

      console.log("Insert Participant Successfully!");
    });
    console.log("Insert Guest Successfully!");
    });
    
    res.redirect(`/${room}`);

    req.session.g_name = req.body.name;
    req.session.save();

});

app.get("/leaveMeeting/:m_id&:id&:type", (req, res) => {
  let current_time = moment().format("YYYY-MM-DD HH:mm:ss");
  const type = req.params.type;
  const m_id = req.params.m_id;
  const id = req.params.id; 
  var sql;
  if(type =="host"){
    let sql1 = "UPDATE meeting SET m_etime = ? where m_id = ? AND m_owner_id =? ";
    let query1 = mysqlConnection.query(sql1,[current_time,m_id,id],(err1, results) => {
      if(err1) throw err1;
      console.log("Host end meeting");
    });

    sql = "UPDATE meeting_participant SET mp_leave_time = ? where m_id = ? AND mp_u_id =? ";
  }
  else if(type=="user"){
    sql = "UPDATE meeting_participant SET mp_leave_time = ? where m_id = ? AND mp_u_id =? ";
  }
  else if(type=="guest"){
    sql = "UPDATE meeting_participant SET mp_leave_time = ? where m_id = ? AND mp_guest_id =? ";
  }

    let query = mysqlConnection.query(sql,[current_time,m_id,id],(err, results) => {
      if(err) throw err;
      console.log("User leave meeting");
      res.redirect("/feedback");
    });
});

app.get("/:room", (req, res) => {
  const u_id = req.session.u_id;
  const u_name = req.session.u_name;
  const guest_id = req.session.g_id;
  const guest_name = req.session.g_name;
  const roomId = req.params.room;
  console.log(u_id);
  console.log(u_name);
  console.log(guest_id);
  console.log(guest_name);
  console.log("enter room "+roomId);
  
  if (uuidV4Validate(req.params.room)) {
    var data = []; 
    let sql = "SELECT * FROM meeting WHERE m_code =? ";
    let query = mysqlConnection.query(sql, [roomId],(err, rows) => {
    if(err) throw err;
      rows.forEach((row) => {
        var queries = [
          "SELECT m_id,m_code,m_stime,u_id as host_id, u_name as host_name,s_id,c_id,cv_id FROM meeting INNER JOIN user ON (user.u_id = meeting.m_owner_id) WHERE m_id =?",
          "SELECT mp_id,mp_u_id,mp_join_time,mp_leave_time,mp_type, t2.u_name,t2.u_profilepic from meeting_participant t1 INNER JOIN user t2 on (t1.mp_u_id = t2.u_id) WHERE m_id =? AND mp_leave_time IS NULL AND mp_guest_id IS NULL ORDER BY mp_join_time ASC",
          "SELECT mp_id,mp_guest_id,mp_join_time,mp_leave_time,mp_type, t2.g_name from meeting_participant t1 INNER JOIN guest t2 on (t1.mp_guest_id = t2.g_id) WHERE m_id =? AND mp_leave_time IS NULL AND mp_u_id IS NULL ORDER BY mp_join_time ASC",
          "SELECT user.u_id as sender_id, user.u_name as sender_name, user.u_profilepic as sender_profilepic, ch_id, ch_content, ch_file, c_id from channel_message INNER JOIN user ON (user.u_id = channel_message.ch_sender_id) WHERE c_id=? AND ch_status='A' ORDER BY ch_datetime ASC",
          "SELECT * FROM chat_message INNER JOIN user WHERE cv_id=? ORDER BY cm_datetime ASC"
        ];

        mysqlConnection.query(queries.join(';'),[row.m_id,row.m_id,row.m_id,row.c_id,row.cv_id],(err, results, fields) => {
    
          if (err) throw err;
  
          res.render('room', {
            u_id:u_id,
            u_name:u_name,
            g_id:guest_id,
            g_name:guest_name,
            roomId:roomId,
            moment: moment,
            meeting: results[0],
            participant : results[1],
            guest : results [2],
            channel_message : results [3],
            chat_message: results [4],
          });
        });
      })
    })
  } else {
    res.status(404).json({ error: true, msg: "Room Not found" });
  }
});

io.on("connection", (socket) => {
  
  /*socket.emit('message','Welcome');
  socket.broadcast.emit('message','A user has enter the page');
  socket.on('disconnect',()=>{
    io.emit('message','A user has left the page');
  });

  // listen for conversation message 
  socket.on('conversationMessage', msg =>{
    io.emit('message',msg);
  });*/

  socket.on('offer', (data) => {
    socket.broadcast.emit('offer', data);
  });

  socket.on('initiate', () => {
    io.emit('initiate');
  });
  

  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userId);
    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, userId);
    });

    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', userId)
    })
  });
});

app.post('/insertChannelMessage',(req, res) => {
  let filePath;
  
  if (!req.files || Object.keys(req.files).length === 0) {
    filePath = null;
  }
  else{
    let sampleFile = req.files.channelFile;
    filePath= 'dist/file/' + sampleFile.name;
    uploadFile(sampleFile);
  }
  
  let current_time = moment().format("YYYY-MM-DD HH:mm:ss");
  var u_id = parseInt(req.body.u_id);
  var c_id = parseInt(req.body.c_id);

  let messageData = {ch_content: req.body.ch_content,ch_file:filePath,ch_datetime:current_time,ch_status:'A',ch_sender_id:u_id,c_id:c_id};
  var toList = [];
  /*for notification purpose */
  let sql = "SELECT DISTINCT room.r_id as r_id,r_title, c_title,c_desc,c_id, u1.u_id as userid, u1.u_name as username, room.r_owner_id, u2.u_name as ownername FROM (room INNER JOIN user u2 ON (room.r_owner_id = u2.u_id)) LEFT JOIN room_record ON (room.r_id = room_record.r_id) INNER JOIN user u1 on (room_record.u_id = u1.u_id) INNER JOIN channel ON (channel.r_id = room.r_id) WHERE channel.c_id = ? AND room_record.rr_status ='A'";
  let query = mysqlConnection.query(sql, [c_id],(err, rows) => {
  if(err) throw err;

    rows.forEach((row) => {
      var venue = row.r_title + " " + row.c_title;
      notis = "has just send a message "+venue;
      if(u_id == row.r_owner_id){
        from = row.ownername;
      }
      if(u_id == row.userid){
        from = row.username;
        toList.push(row.r_owner_id);
      }
      else if(u_id != row.userid) {
        toList.push(row.userid);
      }
      
    });
    notificationContent = {
      "notification":notis,
      "from":from,
      "u_id":toList,
      "date":current_time,
      "status":"unread",
      "type":"chat",
      };
    console.log(notificationContent);
    addNotification(notificationContent);
  });

  let sql1 = "INSERT channel_message SET ?";
    let query1 = mysqlConnection.query(sql1,messageData,(err1, results) => {
      if(err1) throw err1;
      req.flash('info', 'Insert Message Successfully!' );
      res.redirect("/home");
    });

});

function uploadFile(sampleFile,req, res) {
  /*let sampleFile;
  

  if (!req.files || Object.keys(req.files).length === 0) {
    //return res.status(400).send('No files were uploaded.');
    return false;
  }

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  sampleFile = req.files.File;*/
  let uploadPath;
  uploadPath = __dirname + '/public/dist/file/' + sampleFile.name;

  // Use the mv() method to place the file somewhere on your server
  sampleFile.mv(uploadPath, function(err) {
    if (err)
      return false;
      //return res.status(500).send(err);

      //res.send('File uploaded!');
      return true;
  });
};
function uploadImage(sampleFile,req, res) {
  let uploadPath;
  uploadPath = __dirname + '/public/dist/img/avatars/' + sampleFile.name;

  // Use the mv() method to place the file somewhere on your server
  sampleFile.mv(uploadPath, function(err) {
    if (err)
      return false;
      //return res.status(500).send(err);

      //res.send('File uploaded!');
      return true;
  });
};

function generateNotification(r_id,attendees){
  let current_time = moment().format("YYYY-MM-DD HH:mm:ss");
  
    var toList = [];
    /*for notification purpose */
    let sql = "SELECT DISTINCT room.r_id as r_id,r_title, u1.u_id as userid, u1.u_name as username, room.r_owner_id, u2.u_name as ownername FROM (room INNER JOIN user u2 ON (room.r_owner_id = u2.u_id)) LEFT JOIN room_record ON (room.r_id = room_record.r_id) INNER JOIN user u1 on (room_record.u_id = u1.u_id) WHERE room.r_id = ? AND room_record.rr_status ='A'";
    let query = mysqlConnection.query(sql, [r_id],(err, rows) => {
    if(err) throw err;

      rows.forEach((row) => {
        var venue = row.r_title + " ";
        notis = "has just added you into "+venue;
        from = row.ownername;
        const attendeesIsArray = Array.isArray(attendees);
        if (attendeesIsArray == true){
          for($i=0;$i<attendees.length;$i++) {
          
            if(attendees[$i] != '' && attendees[$i] == row.username)
            {
            toList.push(row.userid);
            }
          }
        }
        else{
          if(attendees != '' && attendees== row.username){
            toList.push(row.userid);
          }
        }
        
      });
      notificationContent = {
        "notification":notis,
        "from":from,
        "u_id":toList,
        "date":current_time,
        "status":"unread",
        "type":"person_add",
        };
      console.log(notificationContent);
      addNotification(notificationContent);
    });
}
function addNotification(notificationContent,req,res) {
  var notification = notificationContent.notification;
  // Make sure it's not a string by accident
  console.log(Array.isArray(notificationContent.u_id));

  var u_id = notificationContent.u_id;
  var from = notificationContent.from;
  var date = notificationContent.date;
  var status = notificationContent.status;
  
  // Put it in the object
  notifications.push(notificationContent);

  // Let the request know it's all set
  var reply = {
    status: 'success',
    notification: notification,
    from:from,
    u_id: u_id,
    date:date,
    status:status,
  }
  console.log('adding: ' + JSON.stringify(reply));
  // Write a file each time we get a new word
  // This is kind of silly but it works
  var json = JSON.stringify(notifications, null, 2);
  fs.writeFile('notifications.json', json, 'utf8', finished);
  function finished(err) {
    console.log('Finished writing json');
    // Don't send anything back until everything is done
    //res.send(reply);
  }
}

// Callback
function showAll(req, res) {
  // Send the entire dataset
  // express automatically renders objects as JSON
  res.send(notifications);
}

server.listen(process.env.PORT || 3030);


