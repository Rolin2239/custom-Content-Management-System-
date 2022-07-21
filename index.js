const express = require('express');
const req = require('express/lib/request');
const path = require('path'); 
var myapp = express();
const session = require('express-session');
const upload = require('express-fileupload')
myapp.use(upload());

//mongoDB server connection
const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost:27017/outletOrder', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

const Blog = mongoose.model('Blog', {
    title : String,
    description : String,
    image : String,
})

const Admin = mongoose.model('Admin',{
    username : String,
    password : String,
})

myapp.use(session({
    secret : "randomsecret", 
    resave : false,
    saveUninitialized : true
}))

const{check, validationResult} = require ('express-validator'); 

myapp.use(express.urlencoded({extended:true}))

myapp.set('views', path.join(__dirname,'views'));
myapp.use(express.static(__dirname + '/public'))
myapp.set('view engine', 'ejs');

myapp.get('/', function(req,res){
    Blog.find({}).exec(function (err, blogs) {
        console.log(err);
        res.render('templete', { blogs: blogs });
    })
});

myapp.post('/form', [
    check('title', 'Please input a title').notEmpty(),
    check('description', 'Please input a description').notEmpty()
], function (req, res) 
{
    var errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.render('form', { errors: errors.array() });
    }
    else 
    {
        var title = req.body.title;
        var description = req.body.description;
        if (!req.files) 
        {
            errors = [];
            res.render('form', { errors: [{ msg: "Please upload a photo!" }] });
        } 
        else 
        {
            var image = req.files.myImage;
            var imageName = image.name;
            var imagePath = 'public/useruploaded/' + imageName;
            image.mv(imagePath, (err) => 
            {
                if (err) 
                {
                    console.log("error");
                    res.send(err);
                }
                else 
                {
                    var blog = {
                        title: title,    
                        description: description,
                        image: '/useruploaded/' + imageName,
                    }
                    var blog = new Blog(blog);
                    blog.save().then(function () { 
                        console.log("New blog created");
                        res.redirect('/');
                    })
                }
            })
        }
    }
})

myapp.get('/form', (req, res) => {
    if (req.session.userLoggedIn) {
        res.render('form');
    }
    else {
        res.redirect('/login');
    }
})

myapp.get('/management', (req, res) => {
    if (req.session.userLoggedIn) { // If session exists, then access All posts Page.
        Blog.find({}).exec(function (err, blogs) {
            res.render('management', { blogs: blogs });
        })
    }
    else { // Otherwise redirect user to login page.
        res.redirect('/login');
    }
})

myapp.get('/login', function(req,res){
    res.render('login');
});

myapp.post('/login', function(req,res){
    var user = req.body.username;
    var pass = req.body.password;
    //console.log(user);
    //console.log(pass);

    Admin.findOne({
        username : user,
        password : pass
    }).exec(function(err,admin){
        console.log(`err:${err}`);
        console.log(`admin:${admin}`);
        if(admin){
            req.session.username = admin.username;
            req.session.userLoggedIn = true;
            
            res.redirect('/management')
        }
        else{
            res.render('login',{error : "Sorry, login failed. Please try again"})
        }
    })
})

myapp.get('/logout', function(req,res){
    req.session.username = '';
    req.session.userLoggedIn = false;
    res.render('login', {error:"successfully logged out"});
});

myapp.post('/logout', function(req,res){
    var user = req.body.username;
    var pass = req.body.password;
    //console.log(user);
    //console.log(pass);

    Admin.findOne({
        username : user,
        password : pass
    }).exec(function(err,admin){
        console.log(`err:${err}`);
        console.log(`admin:${admin}`);
        if(admin){
            req.session.username = admin.username;
            req.session.userLoggedIn = true;
            
            res.redirect('/management')
        }
        else{
            res.render('login',{error : "Sorry, login failed. Please try again"})
        }
    })
})

myapp.get('/delete/:id', function(req,res){
    if(req.session.userLoggedIn){
        var id = req.params.id;
        console.log(`_id:${id}`);
        Blog.findByIdAndDelete({_id : id}).exec(function(err,blog){
            console.log(`error:${err}`);
            console.log(`blog:${blog}`);
            if(blog){
                res.render ('delete', {message : "Blog deleted successfully!"});
            }
            else{
                res.render ('delete', {message : "Sorry, blog deleted unsuccessfully!"});
            }
        })
    }
    else{
        res.redirect('/login');
    }
});

myapp.get('/edit/:id', function(req,res){
    if(req.session.userLoggedIn){
        var id = req.params.id;
        console.log(`_id:${id}`);
        Blog.findOne({_id : id}).exec(function(err,blog){
            if(blog){
                res.render ('edit', {blog : blog});
            }
            else{
                res.send ('No blog was found with this id..!');
            }
        })
    }
    else{
        res.redirect('/login');
    }
});

myapp.post('/edit/:id', [
    check('title', 'Please input a title').notEmpty(),
    check('description', 'Please input a description').notEmpty()
], function (req, res) 
{
    var errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.render('edit', { errors: errors.array() });
    }
    else 
    {
        if (!req.files) 
        {
            errors = [];
            res.render('form', { errors: [{ msg: "Please upload a photo!" }] });
            Blog.findOne({ _id: id }).exec(function (err, blog) {
                if (blog) {
                    res.render('edit', { errors: [{ msg: "Please upload a photo" }], blog: blog });
                }
            })
        } 
        else 
        {
            var image = req.files.myImage;
            var imageName = image.name;
            var imagePath = 'public/useruploaded/' + imageName;
            image.mv(imagePath, (err) => 
            {
                if (err) 
                {
                    console.log("error");
                    res.send(err);
                }
                else 
                {
                    var title = req.body.title;
                    var description = req.body.description;
                    var id = req.params.id;
                    Blog.findOne({ _id: id }).exec(function (err, blog) {
                        if (blog) {
                            blog.title = title;
                            blog.description = description;
                            blog.image = '/useruploaded/' + imageName;
                            blog.save();
                            res.render('editsuccess');
                        }
                        else {
                            res.send("No blog found with this id..!");
                        }
                    })
                }
            })
        }
    }
});


myapp.listen(8080);
console.log('everything executed fine...Open http://localhost:8080/');
