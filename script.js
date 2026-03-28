const FB_URL = "https://1bsef-e852e-default-rtdb.firebaseio.com/";

let db = {
    users: [
        { name: "Mehdi Amouhiy", code: "password", role: "admin" },
        { name: "Ahmed Ennagi", code: "Porsche turbo s", role: "student" }
    ],
    schedule: Array(8).fill().map((_, i) => [["8:30","9:30","10:30","11:30","14:30","15:30","16:30","17:30"][i], "","","","","",""]),
    exams: [], homework: [], teachers: []
};

let currentUser = null;

const app = {
    save: async () => {
        try { await fetch(`${FB_URL}/data.json`, { method: 'PUT', body: JSON.stringify(db) }); } catch(e){}
    },
    load: async () => {
        try { 
            const res = await fetch(`${FB_URL}/data.json`);
            const data = await res.json();
            if(data) db = data;
        } catch(e){}
    },
    login: async () => {
        const code = document.getElementById('auth-code').value;
        await app.load(); // Try to get newest users from cloud
        
        const user = db.users.find(u => u.code === code);
        if(user) {
            currentUser = user;
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('main-app').style.display = 'block';
            document.getElementById('user-name').innerText = user.name;
            if(user.role === 'admin') document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
            app.navigate('schedule');
            setInterval(app.load, 15000);
        } else {
            document.getElementById('login-error').style.display = 'block';
        }
    },
    toggleMenu: () => {
        const d = document.getElementById('dropdown');
        d.style.display = (d.style.display === 'none') ? 'block' : 'none';
    },
    navigate: (view) => {
        document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
        document.getElementById('view-' + view).style.display = 'block';
        document.getElementById('dropdown').style.display = 'none';
        app.render(view);
    },
    render: (view) => {
        if(view === 'schedule') {
            const b = document.getElementById('schedule-body');
            b.innerHTML = '<tr><th>Time</th><th>M</th><th>T</th><th>W</th><th>T</th><th>F</th><th>S</th></tr>';
            db.schedule.forEach((row, r) => {
                let tr = `<tr><td>${row[0]}</td>`;
                for(let c=1; c<7; c++) {
                    const edit = (currentUser.role === 'admin') ? `onclick="app.edit(${r},${c})"` : '';
                    tr += `<td ${edit}>${row[c] || '-'}</td>`;
                }
                b.innerHTML += tr + '</tr>';
            });
        }
        // Simplified renders for other views
        if(['exams', 'homework', 'teachers'].includes(view)) {
            const c = document.getElementById(view + '-container');
            c.innerHTML = '';
            db[view].forEach(item => {
                c.innerHTML += `<div class="card"><h4>${item.title}</h4><p>${item.desc}</p></div>`;
            });
        }
    },
    edit: async (r, c) => {
        const val = prompt("Enter Subject:", db.schedule[r][c]);
        if(val !== null) { db.schedule[r][c] = val; await app.save(); app.render('schedule'); }
    },
    logout: () => { location.reload(); }
};
