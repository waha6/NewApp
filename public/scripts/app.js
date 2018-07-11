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
    });
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
async function SignIn() {
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
    let pass = form.pass.value;
    firebase.auth().signInWithEmailAndPassword(mail, pass).then(async (u) => {
        uzer = firebase.auth().currentUser;
        let uobj, mobj;
        if (u) {
            await db.collection('users').doc(uzer.displayName).get().then(r => {
                uobj = r.data()
            });
            await db.collection('SIM').doc(uobj.messageid).get().then(r => {
                mobj = r.data()
            });
            localStorage.setItem('user', JSON.stringify(uobj));
            localStorage.setItem('SIM', JSON.stringify(mobj));
            localStorage.no = mobj.messages.length
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
    uzer = firebase.auth().currentUser;
    let form = document.querySelector('.ads-form');
    let title = form.title.value;
    let cat = document.querySelector('#category').value;
    let descrip = form.description.value;
    let pric = form.price.value;
    let img = "";
    let stored = await storageRef.child(`adimg/${form.pic.files[0].name}/`);
    let snap = await stored.put(form.pic.files[0]);
    let snapshot = await snap.ref.getDownloadURL().then(url => {
        img = url
    });
    db.collection('ads').add({
        "uid": uzer.displayName,
        "uname": u().uname,
        "phone": user.phonenumber,
        "title": title,
        "category": cat,
        "description": descrip,
        "phone": user.phonenumber,
        "imageURL": img,
        "date": new Date(),
        "price": "Rs:" + pric
    }).then(ad => {
        updateUser('users', uzer.displayName, "adsid", ad.id)
    });
    form.reset()
}

function updateUser(c, id, name, value, type, re) {
    let data = db.collection(c).doc(id);
    data.get().then(r => r.data()).then(a => a[name]).then(a => {
        if (type == 'n') a = value;
        else if(!a.includes(value))a.push(value);
        else return false;
        if (!re) {
            let j = JSON.parse(localStorage[(c=='users')?'user':c] || '{}');
            j[name] = a;
            localStorage[(c=='users')?'user':c] = JSON.stringify(j)
        }
        data.update(JSON.parse(`{${JSON.stringify(name)}:${JSON.stringify(a)}}`))
    })
}

function pageLoad(pg) {
    if (pg === "submitad") submitAd();
    else if (pg === "login" && !u()) SignIn();
    else if (pg === "register"&& !user) SignIn();
    else if (pg === "search") search();
    else if (pg === "ad") showAd();
    else if (pg === "inbox"&&user) inboxPage();
    else if (pg === "myads"&&user) myadsPage();
    else if (pg === "myfavorite"&&user) myFavoritePage();
    else if (pg === "replay"&&user) {
        replayPage();
        v = ''
    }
    else homepage();
}

function homepage() {
    let con = document.querySelector('.container');
    db.collection('ads').orderBy('date', 'desc').get().then(r => {
        if (!con.querySelector('main')) con.innerHTML = '<main></main>';
        let m = document.querySelector('main');
        r.forEach(s => {
            m.innerHTML += adBox(s.id, s.data())
        })
    })
}
function myadsPage() {
    let con = document.querySelector('.container');
    db.collection('ads').where('uname','==',u().uname).orderBy('date', 'desc').get().then(r => {
        if (!con.querySelector('main')) con.innerHTML = '<main></main>';
        let m = document.querySelector('main');
        r.forEach(s => {
            m.innerHTML += adBox(s.id, s.data())
        })
    })
}
function myFavoritePage() {
    let con = document.querySelector('.container');
    let fAds = u().favoriteads;
    db.collection('ads').orderBy('date', 'desc').get().then(r => {
        if (!con.querySelector('main')) con.innerHTML = '<main></main>';
        let m = document.querySelector('main');
        r.forEach(s => {
            if(fAds.includes(s.id))
            m.innerHTML += adBox(s.id, s.data())
        })
    })
}
function submitcreateform() {
    let form = document.querySelector('.register-form');
    let mail = form.mail.value;
    let pass = form.pass.value;
    firebase.auth().createUserWithEmailAndPassword(mail, pass).then(async user => {
        uzer = firebase.auth().currentUser;
        let mid = await db.collection('SIM').add({
            messages: []
        }).then(r => r.id);
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
            localStorage.SIM = null;
            localStorage.no = null;
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
        if (st == v[0]) n = v[1]
    });
    return n || null
}

function adBox(id, content) {
    return `<div class="box" id="${id}" onclick="window.location.assign('./?page=ad&adid=${id}')"><div class="adtitle"><h1>${content.title}</h1></div><div class="aduser f50"><div>${content.category}</div><div><h2>${content.price}</h2></div></div><div class="adimg"><img src="${content.imageURL}" width="100%" height="100%"></div><div class="addesciption notcomplete">${content.description}</div></div>`
}

function adPage(id, content) {
    return `<div class="adbox" id="${id}"><div class="adBtitle"><h1>${content.title}</h1></div><h3><div class="adBuser f50">User: ${content.uname}</div><div class="adBphone">Phone No:${content.phone}</div><div class="adBprice">${content.price}</div></h3><div class="adBcat"><h4>Category: " ${content.category}"</h4></div><div class="adimg"><img src="${content.imageURL}" width="100%" height="100%"></div><div class="addesciption">${content.description}</div><div class="adoffline"><a><img src="./images/favorite.svg" width="10%" onclick="addFavorite(this.parentNode.parentNode.parentNode);"></a></div>` + ((u() && content.uname != user.uname) ? `<form onsubmit="return sendMessage(this)" class='message-form' id='${content.uid}'><textarea name='text' rows='7' placeholder='Send message to user for buying this product'></textarea><button>Send</button></form>` : "") + `</div>`
}

function search() {
    let text = locationVar("text") || '';
    let cat = locationVar("cat");
    let con = document.querySelector('.container');
    con.innerHTML = '<div class="man"><div class="loader"></div></div>';
    if (cat == 'all') {
        db.collection('ads').get().then(r => {
            if (!con.querySelector('main')) con.innerHTML = '<main></main>';
            let m = document.querySelector('main');
            r.forEach(s => {
                let d = s.data();
                if (d.title.toLowerCase().indexOf(text.toLowerCase()) != -1) m.innerHTML += adBox(s.id, d)
            })
        })
    } else {
        db.collection('ads').where('category', '==', cat).get().then(r => {
            if (!con.querySelector('main')) con.innerHTML = '<main></main>';
            let m = document.querySelector('main');
            r.forEach(s => {
                let d = s.data();
                if (d.title.toLowerCase().indexOf(text.toLowerCase()) != -1) m.innerHTML += adBox(s.id, d)
            })
        })
    }
}
async function showAd() {
    let con = document.querySelector('.container');
    let id = locationVar('adid');
    db.collection('ads').doc(id).get().then(r => {
        con.innerHTML = adPage(id, r.data())
    })
}

function addFavorite(t) {
        uzer = firebase.auth().currentUser;
        updateUser('users', uzer.displayName, "favoriteads", t.id)
}

function sendMessage(t) {
    if (t.text.value != '') {
        let m = {
            senderid: cu().displayName,
            sendername: u().uname,
            content: t.text.value,
            adtitle: document.querySelector('.adBtitle>h1').innerHTML,
            date: new Date(),
            adid: document.querySelector('.adbox').id
        };
        db.collection('users').doc(t.id).get().then(r => {
            updateUser('SIM', r.data().messageid, 'messages', m, '', 1)
        })
    }
    t.reset();
    return !1
}

function sendReplay(t) {
    if (t.text.value != '') {
        let m = {
            senderid: cu().displayName,
            sendername: u().uname,
            content: t.text.value,
            adtitle: v.adtitle,
            date: new Date(),
            adid: v.adid
        };
        db.collection('users').doc(v.senderid).get().then(r => {
            updateUser('SIM', r.data().messageid, 'messages', m, '', 1)
        })
    }
    t.reset();
    return !1
}

function cu() {
    uzer = firebase.auth().currentUser;
    return uzer
}
async function inboxPage() {
    let con = document.querySelector('.container');
    let n = 0;
    await db.collection('SIM').doc(u().messageid).onSnapshot(function (doc) {
        if (!con.querySelector('main')) con.innerHTML = '<main class="fc"><div class="messageBox flexC"></div></main>';
        let m = con.querySelector('main div');
        let ar = doc.data().messages;
        for (n; n < ar.length; n++) m.innerHTML = makemessage(n, ar[n]) + m.innerHTML
    })
}

function replayPage() {
    let con = document.querySelector('.container');
    let n = locationVar('n');
    let mid = locationVar('mid');
    db.collection('SIM').doc(mid).get().then(r => {
        let content = r.data().messages[n];
        v = content;
        con.innerHTML = `<main class='fc'><div class="adbox"><form onsubmit="return sendReplay(this)" class="message-form"><textarea name="text" rows="7" placeholder="Message replay"></textarea><button>Replay</button></form><div class="messageC flexC"><div><h2> ${content.sendername} ==> [ ${content.adtitle} ]</h2></div><div><h5>messagerid: ${content.senderid}</h5></div><div id='mContent'>${content.content}</div><div class=""><h3>${(new Date(content.date)).toString().split(' GMT')[0]}</h3></div></div></div><main>`
    })
}

function makemessage(n, content) {
    return `<div class="messageC flexC" onclick="window.location.assign('./?page=replay&mid=${u().messageid}&n=${n}')"><div><h2>${content.sendername} ==> [ ${content.adtitle} ]</h2></div><div><h5>messagerid: ${content.senderid}</h5></div><div id='mContent'>${content.content}</div><div><h3>${(new Date(content.date)).toString().split(' GMT')[0]}</h3></div></div>`
}

function loader() {
    return '<div class="man"><div class="loader"></div></div>'
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
if (Notification.permission != 'granted') Notification.requestPermission(s => console.log("Notification Request"));
notificationListener();

function notificationListener() {
    if (u()) {
        n = -1;
        db.collection("SIM").doc(u().messageid).onSnapshot(function (doc) {
            let ar = doc.data().messages.length;
            if (n != -1) {
                if (Notification.permission == 'granted') navigator.serviceWorker.getRegistration().then(r => {
                    r.showNotification('New Message!', {
                        body: 'You have new message',
                        icon: './images/icons/icon-72x72.png',
                        vibrate: [100, 50, 100],
                        data: {
                            primaryKey: 1
                        }
                    })
                })
            } else n = ar.length
        })
    }
}