# ReBid - Reverse Auction Procurement Platform

This is a reverse auction system for procurement. In a normal auction the price goes up. Here it's the opposite: a buyer posts what they need, vendors compete by lowering their price, and the app picks a winner and generates a purchase order for it.

There are three types of accounts:
- **Buyer** - posts requirements, watches bids come in live, awards the contract
- **Vendor** - joins live auctions and bids against other vendors
- **Admin** - approves auctions before they go live, verifies vendor and buyer documents, keeps an eye on fraud alerts

The backend is Python (FastAPI), the frontend is React, and there's a small machine learning model (XGBoost) that scores vendors and recommends who should win a contract.

This guide assumes you've never run a project like this before. Just follow the steps in order and copy-paste the commands exactly as written.

**One important thing before you start:** this app has two separate pieces that both need to be running at the same time - the backend and the frontend. That means you'll have **two terminals open side by side**, each running its own command, and both need to stay open the whole time you're using the app. Step 2 below is Terminal 1 (backend). Step 3 is Terminal 2 (frontend). Don't close either one once it's running.

---

## Before you start

You need three things installed on your computer. If you already have them, skip ahead.

1. **Python 3.10 or newer** - [python.org/downloads](https://www.python.org/downloads/)
   - On Windows, when installing, tick the box that says "Add Python to PATH". Don't skip this.
2. **Node.js 18 or newer** - [nodejs.org](https://nodejs.org/) (this also installs `npm`, which you'll need)
3. **VS Code** - [code.visualstudio.com](https://code.visualstudio.com/) if you don't already have it

To check if Python and Node are already installed, open VS Code, go to the top menu and click **Terminal > New Terminal**, and paste these one at a time:

```
python --version
```

```
node --version
```

If both print a version number, you're good. If either says "command not found" or similar, go install that one and restart VS Code.

---

## Step 1: Open the project in VS Code

Open VS Code, then **File > Open Folder**, and select the `rebid neha` project folder.

Once it's open, open a terminal from the top menu: **Terminal > New Terminal**. Everything below happens in this terminal.

---

## Step 2: Terminal 1 - Start the backend (the server)

This is the terminal you already have open from Step 1. Copy and paste each of these commands one at a time, pressing Enter after each one, and wait for it to finish before running the next.

**Create a virtual environment** (this keeps the project's Python packages separate from everything else on your machine):

```
python -m venv venv
```

**Turn it on:**

Windows:
```
.\venv\Scripts\activate
```

Mac or Linux:
```
source venv/bin/activate
```

If Windows gives you a red error about "running scripts is disabled", paste this first and then try the activate command again:
```
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

You'll know it worked because you'll see `(venv)` appear at the start of the line in your terminal.

**Install everything the backend needs:**

```
pip install -r requirements.txt
```

This will take a minute or two, it's downloading a bunch of packages.

**Copy the environment file:**

Windows:
```
copy .env.example .env
```

Mac or Linux:
```
cp .env.example .env
```

You don't need to open or edit this file. It just holds some settings the backend reads on startup.

**Now start the backend:**

```
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8001 --reload
```

If it worked, you'll see a message ending in something like `Application startup complete`. **Leave this terminal open and running - don't close it, don't press Ctrl+C, don't type anything else into it.** This is Terminal 1, and it needs to sit here running for as long as you're using the app.

You can check it's alive by opening this in a browser: [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs) - you should see a page listing a bunch of API endpoints. If that page loads, Terminal 1 is doing its job. Now leave it alone and move to Terminal 2 below.

---

## Step 3: Terminal 2 - Start the frontend (what you actually see and click on)

Terminal 1 has to keep running in the background, untouched. Don't type into it or close it. Instead, open a **brand new, second terminal**: in VS Code, look at the terminal panel at the bottom, and click the `+` icon on the right side of it (or go to the top menu, **Terminal > New Terminal**, again). You should now see two terminals listed, something like "1: powershell" and "2: powershell" - you're about to use terminal 2.

Click into that new terminal 2 tab, then type these commands into it (not terminal 1):

```
cd frontend
```

```
npm install
```

This also takes a minute the first time.

```
npm run dev
```

You'll see something like `Local: http://localhost:5173/`. Open that link in your browser - that's the app.

**Recap of where you should be right now:** Terminal 1 is running the backend and showing `Application startup complete`. Terminal 2 is running the frontend and showing `Local: http://localhost:5173/`. Neither one has finished or stopped, they're both just sitting there running. If either one stops or you see an error, that's the one you need to look at and restart.

---

## Test accounts (log in with these, no need to register)

Every account below uses the same password:

```
password123
```

| Role | Email |
|---|---|
| Buyer | buyer@rebid.ai |
| Admin | admin@rebid.ai |
| Vendor | vendor1@rebid.ai |
| Vendor (second one, useful for watching two vendors bid against each other) | vendor2@rebid.ai |

There are more pre-loaded vendor accounts if you want variety, all with the same password: `tatasteel@rebid.ai`, `bluedart@rebid.ai`, `amazon@rebid.ai`.

Go to [http://localhost:5173](http://localhost:5173), pick a portal, and log in with any of the above.

---

## A quick walkthrough of what the app actually does

1. **Log in as the buyer** (`buyer@rebid.ai`). Create a new procurement request - give it a title, a budget, pick a category. It gets submitted and sits there waiting for approval.

2. **Log in as admin** (`admin@rebid.ai`) in a different browser tab, or log the buyer out first. Go to Procurement Approvals and approve the request you just made. It goes live.

3. **Log in as a vendor** (`vendor1@rebid.ai`). You'll see the auction in the live bidding room. Place a bid lower than the current one and watch the leaderboard update in real time. If you have a second browser (or an incognito window), log in as `vendor2@rebid.ai` too and bid against yourself to see the competition happen live.

4. **Back to the buyer.** Once you're happy with the bids, click the AI recommendation button - this runs the bids through the scoring model, which weighs price, past reliability, delivery speed, and reviews to suggest a winner. Award the contract and a purchase order PDF gets generated automatically, with tax calculated and everything.

That's the whole loop: post a need, get it approved, watch vendors compete, pick a winner, get a document out the other end.

---

## If email verification comes up

If you register a brand new account instead of using the test ones above, it'll ask for a 6-digit code sent to your email. You don't need a real email service set up for this - since there's no email API key configured by default, the backend just prints the code straight into the backend terminal instead, something like:

```
[DEV MODE] OTP for someone@example.com: 849201
```

Just copy that number and type it into the verification box in the browser.

---

## Where everything lives, roughly

```
rebid neha/
├── backend/
│   └── app/
│       ├── main.py       - most of the API routes live here
│       ├── models.py     - the database tables
│       ├── services.py   - fraud detection, PDF generation
│       └── routes/       - login, registration, admin document review
├── frontend/
│   └── src/
│       ├── pages/        - the buyer, vendor, and admin screens
│       ├── components/   - shared bits like the navigation bar and modals
│       └── context/      - login state, shared across the app
├── ml/
│   ├── xgb_model.json    - the trained model file
│   └── predict.py        - loads the model and scores vendors
└── rebid.db              - the actual database (a single file, gets created automatically)
```

---

## If something breaks

**"Port already in use"** - something is already running on that port. Either close whatever it is, or for the backend, swap `--port 8001` in the start command for `--port 8002` (and change the frontend's port too if you go this route - it's set in `frontend/src` in a few places as `http://localhost:8001`, so search-and-replace if you switch).

**Frontend loads but nothing works / login fails** - almost always means the backend terminal isn't running anymore, or it crashed. Go check that first terminal.

**Want to wipe everything and start fresh** - close the backend, delete the file `rebid.db` in the project root, and start the backend again. It rebuilds the database and reloads all the test accounts automatically.

**PowerShell won't let you activate the virtual environment** - run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in that same terminal, then try again.

---

That's it. Two terminals running, one browser tab open, log in with any of the test accounts above.
