#!/bin/bash
gunicorn --bind=0.0.0.0:8000 --timeout 600 app:app
```

4. **Save**

---

## 📁 **Struktur Folder Akhir:**
```
PROYEKWEBSITESAYA/
├── static/
│   ├── admin.js
│   ├── script.js
│   └── style.css
├── templates/
│   ├── admin.html
│   ├── index.html
│   └── login.html
├── app.py
├── database.db           ← TIDAK akan di-upload (di-ignore)
├── requirements.txt      ← EDIT (ganti isinya)
├── .gitignore           ← BARU (buat file ini)
├── README.md            ← BARU (buat file ini)
└── startup.sh           ← BARU (buat file ini)