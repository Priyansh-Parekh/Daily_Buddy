const mongoose = require('mongoose');
const express = require('express');
const route = express.Router();
const axios = require('axios');
const udata = require("../models/userdata");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');




//login middelware:
const login = async (req, res, next) => {
    try {
        if (!req.cookies.token || req.cookies.token === "") {
            req.user = "email";
        } else {
            const token = req.cookies.token;
            const decoded = jwt.verify(token, "secret-word");
            req.user = await udata.findOne({ email: decoded.email });
        }
    } catch (error) {
        console.error("Authentication Error:", error);
        req.user = "email";
    }
    next();
};


// true_false

const current_month = async (req, res, next) => {
    try {
        const user = req.user;
        if (user !== "email") {

            const thisMonth = new Date().toISOString().slice(0, 7);
            const existingMonth = user.money_manager.find(entry => entry.month === thisMonth);

            if (!existingMonth) {
                // No record yet → Add this month's money manager
                await user.updateOne({
                    $set: {
                        currnet_month_exist: false
                    }
                });
            } else {
                // Already exists → Just update the flag if needed
                await user.updateOne({
                    $set: {
                        currnet_month_exist: true
                    }
                });
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Error updating current mont exist");
    }
    next();
}



route.get('/', login, current_month, async (req, res) => {

    let user = req.user

    res.render("index", { user: req.user });
})


//login route
route.get('/login', login, async (req, res) => {
    res.render("login", { user: req.user });
})

route.post('/login', async (req, res) => {
    let { email, password } = req.body;
    //checking that user already exist
    const check = await udata.findOne({ email });
    if (check) {
        bcrypt.compare(req.body.password, check.password, (err, result) => {
            if (err) {
                console.error(err);
                console.log(1)
                return res.status(500).send("Error verifying password");
            }
            if (result) {
                let token = jwt.sign({ email }, "secret-word");
                res.cookie("token", token)
            } else {
                return res.status(500).send("Error verifying password");
            }
            res.redirect("/",)
        })

    } else {
        console.error("Something Went Worng!");
        res.redirect("/");
    }
})

//sign-up route
route.get('/sign_up', login, async (req, res) => {
    res.render("signup", { user: req.user });
})

route.post('/sign_up', login,  async (req, res) => {
    try {
        let { name, email, password, country } = req.body;
        //checking that user of this email already exist or not.
        const check = await udata.findOne({ email });
        console.log(check);
        if (check) {
            alert("Something went wrong!");
            res.redirect("/")
        } else {
            //providing more sequrity to its password/
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            const user = await udata.create({ name, email, password: hash, country })

            //providing cookies to keep him logged in//
            let token = jwt.sign({ email }, "secret-word");
            res.cookie("token", token);
            res.redirect("/");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Error creating user");
    }
})

//log-out route
route.get('/log_out', login, current_month, async (req, res) => {
    res.render("log_out", { user: req.user });
})

route.post('/log_out', login, current_month, async (req, res) => {
    try {
        res.clearCookie("token");
        res.redirect("/");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error creating user");
    }
})

// Proxy route to fetch the daily quote
route.get('/api/quote', login, current_month, async (req, res) => {
    try {
        const response = await fetch('https://uselessfacts.jsph.pl/api/v2/facts/today');
        const data = await response.json();
        res.json(data); // Send fact back to the frontend
    } catch (err) {
        console.error("Failed to fetch fact:", err);
        res.status(500).json({ error: "Failed to fetch fact" });
    }
});

// GET /api/countries
route.get('/api/countries', login, current_month, async (req, res) => {
    try {
        const response = await axios.get('https://restcountries.com/v3.1/all?fields=name');

        const countries = response.data
            .map(country => country?.name?.common || 'Unknown')
            .sort((a, b) => a.localeCompare(b));

        res.json(countries);
    } catch (error) {
        console.error("Error fetching countries:", error.message);
        res.status(500).json({ error: 'Failed to load countries' });
    }
});

// to send data for graph
route.get('/api/user/money_manager', login, async (req, res) => {
  try {
    const user = req.user;
    res.json(user.money_manager);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch money manager data" });
  }
});


//To_do_list route
route.get('/to_do_list', login, current_month, async (req, res) => {
    res.render("to_do_list", { user: req.user });
})

route.post('/to_do_list', login, async (req, res) => {
    try {
        const { data, category } = req.body;
        const user = req.user;

        await user.updateOne({
            $push: {
                [`to_do_list.${category}`]: {
                    data: data
                }
            }
        });

        res.redirect("/to_do_list");
    } catch (error) {
        console.error("Error adding task:", error);
        res.status(500).send("Internal Server Error");
    }
});
route.post('/to_do_list/delete', login, current_month, async (req, res) => {
    try {
        const { _id, category } = req.body;
        const user = req.user;

        await user.updateOne({
            $pull: {
                [`to_do_list.${category}`]: { _id: new mongoose.Types.ObjectId(_id) }
            }
        });

        res.redirect("/to_do_list");
    } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).send("Internal Server Error");
    }
});



//attendance route
route.get('/attendance', login, current_month, async (req, res) => {
    res.render("attendance", { user: req.user });
})

route.post('/attendance/add-subject', login, current_month, async (req, res) => {
    try {
        const { subject } = req.body;
        const user = req.user;

        await user.updateOne({
            $push: {
                'attendance.subjects': {
                    subject: subject,
                    records: []  // initialize with empty records if needed
                }
            }
        });

        res.redirect('/attendance'); // redirect to your attendance page
    } catch (error) {
        console.error("❌ Error adding subject:", error);
        res.status(500).send("Internal Server Error");
    }
});

route.post('/attendance/entry', login, current_month, async (req, res) => {
    try {


        const { selectedSubject01, dates, statuses } = req.body;
        const user = req.user;

        // Ensure subject, dates, and statuses exist
        if (!selectedSubject01 || !dates || !statuses) {
            res.redirect("/attendance/#attend---entry")
            return res.status(400).send("Missing subject, dates, or statuses.");

        }

        // Convert single values to arrays
        const dateArray = Array.isArray(dates) ? dates : [dates];
        const statusArray = Array.isArray(statuses) ? statuses : [statuses];



        if (dateArray.length !== statusArray.length) {
            res.redirect("/attendance/#attend---entry")
            return res.status(400).send("Mismatch in number of dates and statuses.");
        }

        // Create attendance records
        const recordsToAdd = dateArray.map((date, index) => ({
            date: new Date(date),
            status: statusArray[index]
        }));


        // Find subject inside user's attendance array
        const subjectEntry = user.attendance.subjects.find(sub => sub.subject === selectedSubject01);


        //  Prevent duplicate dates
        const existingDates = subjectEntry.records.map(r => r.date.toISOString().split('T')[0]);

        const filteredRecords = recordsToAdd.filter(
            r => !existingDates.includes(r.date.toISOString().split('T')[0])
        );

        subjectEntry.records.push(...filteredRecords);

        await user.save();
        res.redirect('/attendance/#attend---entry');
    } catch (error) {
        console.error("❌ Error submitting attendance:", error);
        res.status(500).send("Internal Server Error");
    }
});

route.post("/attendance/date/delete", login, current_month, async (req, res) => {
    try {
        let { date, subject } = req.body;
        const user = req.user;

        // Find subject inside user's attendance array
        const subjectE = user.attendance.subjects.find(sub => sub.subject === subject);
        subjectE.records = subjectE.records.filter(rec => {
            return new Date(rec.date).getTime() !== new Date(date).getTime();
        })

        await user.save();
        res.redirect("/attendance/#attend---edit")
    } catch (error) {
        console.error("❌ Error deleting attendance:", error);
        res.status(500).send("Internal Server Error");
    }
})

route.post("/attendance/date/status_change", login, current_month, async (req, res) => {
    try {
        let { date, subject } = req.body;
        const user = req.user;

        // Find subject inside user's attendance array
        const subjectE = user.attendance.subjects.find(sub => sub.subject === subject);
        subjectE.records.forEach(rec => {
            if (new Date(rec.date).getTime() === new Date(date).getTime()) {
                rec.status = rec.status === "present" ? "absent" : "present";
            }
        });

        await user.save();
        res.redirect("/attendance/#attend---edit")
    } catch (error) {
        console.error("❌ Error deleting attendance:", error);
        res.status(500).send("Internal Server Error");
    }
})



//imp_cowntdown route
route.get('/imp_cowntdown', login, current_month, async (req, res) => {
    res.render("imp_cowntdown", { user: req.user });
})
route.post('/imp_cowntdown/add_reminder', login, async (req, res) => {
    try {
        let { title, description, category, due } = req.body;

        const user = req.user


        user.exam_countdown.push({
            title,
            description,
            category,
            due: new Date(due)  // Convert to proper Date object
        });

        await user.save();

        res.redirect("/imp_cowntdown");

    } catch (error) {
        console.error("❌ Error adding reminder:", error);
        res.status(500).send("Internal Server Error");
    }
});

route.post("/imp_cowntdown/delete", login, current_month, async (req, res) => {
    try {
        const { _id } = req.body;
        const user = req.user;

        await user.updateOne({
            $pull: {
                exam_countdown: { _id } // Use object match
            }
        });

        await user.save();
        res.redirect("/imp_cowntdown");

    } catch (error) {
        console.error("❌ Error deleting reminder:", error);
        res.status(500).send("Internal Server Error");
    }
});

route.post("/imp_cowntdown/status_change", login, current_month, async (req, res) => {
    try {
        const { _id } = req.body;
        const user = req.user;

        user.exam_countdown.forEach(item => {
            if (item._id.toString() === _id) {
                item.isCompleted = true;
            }
        });

        await user.save();
        res.redirect("/imp_cowntdown");

    } catch (error) {
        console.error("❌ Error updating reminder status:", error);
        res.status(500).send("Internal Server Error");
    }
});


//Monthly Money tracker//
route.get('/money_tracker', login, current_month, async (req, res) => {
    res.render("money_tracker", { user: req.user });
})

route.post("/money_tracker/setupofmonth", login, current_month, async (req, res) => {
    try {
        const { income, budget } = req.body;
        const user = req.user;

        const thisMonth = new Date().toISOString().slice(0, 7);
        const existingMonth = user.money_manager.find(entry => entry.month === thisMonth);

        if (!existingMonth) {
            // No record yet → Add this month's money manager
            await user.updateOne({
                $push: {
                    money_manager: {
                        month: thisMonth,
                        income: Number(income),
                        budget: Number(budget),
                        balance: Number(income),
                        income_record: [{
                            date: new Date().toISOString().slice(0, 7),
                            amount: Number(income)
                        }],
                        expense_record: []
                    }
                },
                $set: {
                    currnet_month_exist: true
                }
            });
        } else {
            // Already exists → Just update the flag if needed
            await user.updateOne({
                $set: {
                    money_manager: {
                        month: thisMonth,
                        income: Number(income),
                        budget: Number(budget),
                        balance: Number(income)
                    }
                },
                $set: {
                    currnet_month_exist: true
                }
            });
        }

        // Sort by month in ascending order (oldest → newest)
       if (user.money_manager.length > 2) {
        user.money_manager.sort((a, b) => a.month.localeCompare(b.month));
       }
        // Remove the oldest if more than 12 entries
        if (user.money_manager.length > 12) {
            user.money_manager.splice(0, 1); // Removes index 0 = oldest
        }

        await user.save();

        res.redirect("/money_tracker");
    } catch (error) {
        console.error("❌ Error setting up month:", error);
        res.status(500).send("Internal Server Error");
    }
});

route.post("/money_tracker/add_expense_record", login, current_month, async (req, res) => {
    try {
        const user = req.user;
        let { date, description, amount, category } = req.body;
        const thisMonth = new Date().toISOString().slice(0, 7);

        // ✅ Use .find() correctly (no await needed — it's an in-memory array)
        let now_month = user.money_manager.find(data => data.month === thisMonth);

        // ✅ Proper object syntax when pushing
        now_month.expense_record.push({
            date: new Date(date), // Convert to Date object
            description,
            amount: Number(amount),
            category
        });

        // ✅ Update expense and balance
        now_month.expense += Number(amount);
        now_month.balance -= Number(amount)

        await user.save(); // ✅ Save the changes to MongoDB

        res.redirect("/money_tracker/#moneytracker-expense-form-id");

    } catch (error) {
        console.error("❌ Error setting up month:", error);
        res.status(500).send("Internal Server Error");
    }
});

route.post("/money_tracker/expense_record_delete", login, current_month, async (req, res) => {

    const user = req.user;
    let { _id } = req.body;
    const thisMonth = new Date().toISOString().slice(0, 7);

    // ✅ Use .find() correctly (no await needed — it's an in-memory array)
    let now_month = user.money_manager.find(data => data.month === thisMonth);


    // reversing the balance and expense
    let this_record = now_month.expense_record.find(data => data._id.toString() === _id)
    now_month.expense -= Number(this_record.amount);
    now_month.balance += Number(this_record.amount);


    // ✅ Proper object syntax when pushing
    now_month.expense_record.pull({ _id });



    await user.save()

    res.redirect("/money_tracker/#moneytracker-expense-table")
});



route.post("/money_tracker/add_income_record", login, current_month, async (req, res) => {
    try {
        const user = req.user;
        let { date, category, amount } = req.body;
        const thisMonth = new Date().toISOString().slice(0, 7);

        // ✅ Use .find() correctly (no await needed — it's an in-memory array)
        let now_month = user.money_manager.find(data => data.month === thisMonth);

        // ✅ Proper object syntax when pushing
        now_month.income_record.push({
            date: new Date(date), // Convert to Date object
            amount: Number(amount),
            category
        });

        // ✅ Update expense and balance
        now_month.income += Number(amount);
        now_month.balance += Number(amount)

        await user.save(); // ✅ Save the changes to MongoDB

        res.redirect("/money_tracker/#moneytracker-income-form-id");

    } catch (error) {
        console.error("❌ Error setting up month:", error);
        res.status(500).send("Internal Server Error");
    }
});


route.post("/money_tracker/income_record_delete", login, current_month, async (req, res) => {

    const user = req.user;
    let { _id } = req.body;
    const thisMonth = new Date().toISOString().slice(0, 7);

    // ✅ Use .find() correctly (no await needed — it's an in-memory array)
    let now_month = user.money_manager.find(data => data.month === thisMonth);


    // reversing the balance and expense
    let this_record = now_month.income_record.find(data => data._id.toString() === _id)
    now_month.income -= Number(this_record.amount);
    now_month.balance -= Number(this_record.amount);


    // ✅ Proper object syntax when pushing
    now_month.income_record.pull({ _id });



    await user.save()

    res.redirect("/money_tracker/#moneytracker-income-table")
});

module.exports = route;