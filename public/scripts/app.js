const config = {
    apiKey: "AIzaSyDaQT4TZzbbVZUEUBvzrUPk6DDecxcbQAw",
    authDomain: "olx-pwapp.firebaseapp.com",
    databaseURL: "https://olx-pwapp.firebaseio.com",
    projectId: "olx-pwapp",
    storageBucket: "olx-pwapp.appspot.com",
    messagingSenderId: "1085851231788"
};
var storage, storageRef, db, uzer, user;

function firebaseConfig() {
    storage = firebase.storage();
    storageRef = storage.ref();
    firebase.firestore().settings({
        timestampsInSnapshots: !0
    })
    firebase.firestore().enablePersistence();
    db = firebase.firestore();
    uzer = firebase.auth().currentUser;
    u()
}

function u() {
    user = (localStorage.user) ? JSON.parse(localStorage.user) : null;
    return user
}

function openNav(t) {
    t.classList.remove('hide')
}

function closeNav(t) {
    t.classList.add('hide')
}
async function myAccount() {
    let req = await fetch("../assests/login.json");
    let json = await req.json();
    document.querySelector(".container").innerHTML = "" + ((page == 'register') ? json.register : (page == 'login') ? json.login : "")
}

function addScript(file) {
    let imported = document.createElement('script');
    imported.src = file;
    document.head.appendChild(imported)
}

function submitloginform() {
    let form = document.querySelector('.login-form');
    let mail = form.mail.value;
    let pass = form.pass.value
    firebase.auth().signInWithEmailAndPassword(mail, pass).then(async (u) => {
        uzer = firebase.auth().currentUser;
        let uobj,mobj;
        if (u) {
            console.log('start')
            await db.collection('users').doc(uzer.displayName).get().then(r => {
                uobj = r.data()
            })
            await db.collection('SIM').doc(uobj.messageid).get().then(r => {
                mobj = r.data()
            })
            console.log(uobj)
            localStorage.setItem('user', JSON.stringify(uobj));
            localStorage.setItem('SIM', JSON.stringify(mobj));
            localStorage['no']=mobj.messages.length;
            console.log("finish")
        }
        form.reset();
        window.history.back();
        return !1
    }).catch(function (error) {
        setError(error.message, 3000)
    });
    return !1
}

function logout(item) {
    firebase.auth().signOut();
    localStorage.user = null;
    item.style.display = "none";
    window.location.reload()
}
async function submitAd() {
    if (u()) {
        let req = await fetch("../assests/submitads.json");
        let json = await req.json();
        let con = document.querySelector(".container");
        con.innerHTML = "" + json.data
    } else {
        window.location.assign("./?page=login")
    }
}
async function submitPushAd() {
    console.log("done");
    uzer = firebase.auth().currentUser;
    let u = JSON.parse(u());
    let form = document.querySelector('.ads-form');
    let title = form.title.value;
    let cat = document.querySelector('#category').value;
    let descrip = form.description.value;
    let pric = form.price.value;
    let img = "";
    let stored = await storageRef.child(`adimg/${form.pic.files[0].name}/`);
    let snap = await stored.put(form.pic.files[0]);
    let snapshot = await snap.ref.getDownloadURL().then(url => {
        img = url;
        console.log(url)
    })
    db.collection('ads').add({
        "uid": uzer.displayName,
        "uname": u.uname,
        "phone": u.phonenumber,
        "title": title,
        "category": cat,
        "description": descrip,
        "phone": u.phonenumber,
        "imageURL": img,
        "price": "Rs:" + pric
    }).then(ad => {
        updateUser('users', uzer.displayName, "adsid", ad.id)
    });
    form.reset()
}

function updateUser(c, id, name, value, type) {
    let data = db.collection(c).doc(id);
    data.get().then(r => r.data()).then(a => a[name]).then(a => {
        if (type == 'n')
            a = value;
        else a.push(value);
        debugger
        let j = JSON.parse(localStorage[c]||'{}');
        j[name] = a;
        localStorage[c] = JSON.stringify(j);
        data.update(JSON.parse(`{${JSON.stringify(name)}:${JSON.stringify(a)}}`))
    })
}

function pageLoad(pg) {
    if (pg === "category")
        homepage();
    else if (pg === "homepage")
        homepage();
    else if (pg === "submitad")
        submitAd();
    else if (pg === "login")
        myAccount();
    else if (pg === "register")
        myAccount();
    else if (pg === "search")
        search();
    else if (pg === "ad")
        showAd();
    else if (pg === "inbox")
        inboxPage();
    else if (pg === "replay")
        replayPage();
}

function homepage() {
    let con = document.querySelector('.container');
    db.collection('ads').get().then(r => {
        if (!con.querySelector('main'))
            con.innerHTML = '<main></main>'
        let m = document.querySelector('main');
        r.forEach(s => {
            m.innerHTML += adBox(s.id, s.data())
        })
    })
}

function submitcreateform() {
    let form = document.querySelector('.register-form');
    let mail = form.mail.value;
    let pass = form.pass.value
    firebase.auth().createUserWithEmailAndPassword(mail, pass).then(async user => {
        uzer = firebase.auth().currentUser;
        let mid = await db.collection('SIM').add({messages:[]}).then(r => r.id);
        let uobj = {
            "adsid": [],
            "favoriteads": [],
            "messageid": mid,
            "phonenumber": "+92" + form.phone.value,
            "uemail": uzer.email,
            "uid": uzer.uid,
            "uname": form.name.value
        };

        db.collection("users").add(uobj).then(async res => {
            uzer.updateProfile({
                displayName: res.id
            });
            localStorage.setItem("user", JSON.stringify(uobj));
            form.reset();
            window.location.assign("./?page=category")
        });
        return !1
    }).catch((error) => {
        setError(error.message, 3000)
    });
    return !1
}

function setError(errorMessage, time) {
    let err = document.querySelector('#err');
    setTimeout(() => {
        closeNav(err)
    }, time);
    openNav(err);
    document.querySelector('#errmessage').innerHTML = errorMessage
}
async function json(file) {
    return await fetch(file).then(r => r.json())
}

function locationVar(st) {
    let n;
    window.location.search.substring(1).split("&").forEach(s => {
        let v = s.split("=");
        if (st == v[0])
            n = v[1]
    });
    return n || null
}

function adBox(id, content) {
    return `<div class="box" id="${id}" onclick="window.location.assign('./?page=ad&adid=${id}')"><div class="adtitle"><h1>${content.title}</h1></div><div class="aduser f50"><div>${content.category}</div><div><h2>${content.price}</h2></div></div><div class="adimg"><img src="${content.imageURL}" width="100%" height="100%"></div><div class="addesciption">${content.description}</div><div class="adoffline"><a><img src="./images/favorite.svg" width="10%" onclick="addFavorite(document.querySelector('.adbox'));"></a></div></div>`
}

function adPage(id, content) {
    return `<div class="adbox" id="${id}"><div class="adBtitle"><h1>${content.title}</h1></div><h3><div class="adBuser f50">User: ${content.uname}</div><div class="adBphone">Phone No:${content.phone}</div><div class="adBprice">${content.price}</div></h3><div class="adBcat"><h4>Category: " ${content.category}"</h4></div><div class="adimg"><img src="${content.imageURL}" width="100%" height="100%"></div><div class="addesciption">${content.description}</div><div class="adoffline"><a><img src="./images/favorite.svg" width="10%" onclick="addFavorite(document.querySelector('.adbox'));"></a></div>` + (u() ? `<form onsubmit="return sendMessage(this)" class='message-form' id='${content.uid}'><textarea name='text' rows='7' placeholder='Send message to user for buying this product'></textarea><button>Send</button></form>` : "") + `</div>`
}

function search() {
    let text = locationVar("text") || '';
    let cat = locationVar("cat");
    let con = document.querySelector('.container');
    con.innerHTML = '<div class="man"><div class="loader"></div></div>';
    if (cat == 'all') {
        db.collection('ads').get().then(r => {
            if (!con.querySelector('main'))
                con.innerHTML = '<main></main>'
            let m = document.querySelector('main');
            r.forEach(s => {
                let d = s.data();
                if (d.title.toLowerCase().indexOf(text.toLowerCase()) != -1)
                    m.innerHTML += adBox(s.id, d)
            })
        })
    } else {
        db.collection('ads').where('category', '==', cat).get().then(r => {
            if (!con.querySelector('main'))
                con.innerHTML = '<main></main>'
            let m = document.querySelector('main');
            console.log(r);
            r.forEach(s => {
                let d = s.data();
                if (d.title.toLowerCase().indexOf(text.toLowerCase()) != -1)
                    m.innerHTML += adBox(s.id, d)
            })
        })
    }
}
async function showAd() {
    let con = document.querySelector('.container');
    let id = locationVar('adid');
    db.collection('ads').doc(id).get().then(r => {
        console.log(r.data());
        con.innerHTML = adPage(id, r.data())
    })
}

function addFavorite(t) {
    if (navigator.online) {
        uzer = firebase.auth().currentUser;
        updateUser('users', uzer.displayName, "favoriteads", t.id)
    }
}
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register("sw.js").then(function () {
        console.log('SW Registerd')
    }, function () {
        console.log('SW Registration Failed')
    })
} else {
    console.log('SW Not Supported')
}
firebase.initializeApp(config);
firebaseConfig();

function sendMessage(t) {
    if (t.text.value != '') {
        let m ={
            senderid:cu().displayName,
            sendername:u().uname,
            content:t.text.value,
            adtitle:document.querySelector('.adBtitle>h1').innerHTML,
            date:new Date(),
            adid:document.querySelector('.adbox').id
        }
        debugger
        console.log(m);
        updateUser('SIM',u().messageid,'messages',m);
        localStorage['no']=JSON.parse(localStorage['SIM']).messages.length;
    }
    return !1
}
function cu(){
    uzer=firebase.auth().currentUser;
    return uzer;
}
async function inboxPage(){
    let con = document.querySelector('.container');
    let n=0;
    await db.collection('SIM').doc(u().messageid).onSnapshot(function(doc) {
        if(!con.querySelector('main'))
            con.innerHTML = '<main><div class="messageBox flexC"></div></main>'
        let m = con.querySelector('main div')
       let ar = doc.data().messages;
        console.log(" data: ", ar.toString());
		for(n;n<ar.length;n++)
			m.innerHTML = makemessage(n,ar[n])+m.innerHTML;
    });
}
function replayPage(){
    let con = document.querySelector('.container');
    let n=locationVar('n');
    let mid=locationVar('mid');
    let v;
    db.collection('SIM').doc(mid).get().then(r=>{
        let content = r.data().messages[n];
        con.innerHTML=`<main>
        <script> var v=${JSON.stringify(content)}; v = JSON.parse(v);</script>
        <div class="adbox">
        <form onsubmit="return !1" class='message-form'>
            <textarea name='text' rows='7' placeholder='Message replay'></textarea>
            <button>Replay</button>
        </form>
        <div class="messageC flexC" ><div><h2>Message by: [ ${content.sendername}] ==> [ ${content.adtitle} ]</h2></div><div><h5>messageid: ${content.senderid}</h5></div><div><h2>${content.content}</h2></div><div class=''><h3>${content.date}</h3></div></div></div></main>`;
    });
}
function makemessage(n,content){
    return `<div class="messageC flexC" onclick="window.location.assign('./?page=replay&mid=${u().messageid}&n=${n}')"><div><h2>Message by: [ ${content.sendername}] ==> [ ${content.adtitle} ]</h2></div><div><h5>messageid: ${content.senderid}</h5></div><div><h2>${content.content}</h2></div><div class=''><h3>${content.date}</h3></div></div>`;
}

// con = document.querySelector('.container')
// <div class=​"container">​…​</div>​
// con.innerHTML =''
// ""
// let n = 0;
// undefined
// db.collection("SIM").doc("mLEGc9NmaTtzVBQsIY57")
//     .onSnapshot(function(doc) {
//         var source = doc.metadata.hasPendingWrites ? "Local" : "Server";
// 		let ar = doc.data().messages;
//         console.log(source, " data: ", ar.toString());
// 		for(n;n<ar.length;n++)
// 			con.innerHTML += ar[n]+'<br>';
//     });