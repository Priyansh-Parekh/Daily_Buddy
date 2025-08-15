const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://priyanshparekh24:ONrFOXQ9foslYv93@ace-up-data.wkfpvme.mongodb.net/Daily-Buddy', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('✅ Connected to MongoDB Atlas!'))
    .catch(err => console.error('❌ Connection error:', err));

const Schema = mongoose.Schema;


//to do list schema
const taskSchema = new Schema({
    data: { type: String },
});


//attendance schema
const dateRecordSchema = new mongoose.Schema({
    date: {
        type: Date
    },
    status: {
        type: String,
        enum: ['present', 'absent']

    }
}, { _id: false });

const subjectAttendanceSchema = new mongoose.Schema({
    subject: {
        type: String,
        trim: true
    },
    records: [dateRecordSchema]
}, { _id: false });


//countdown schema
const countdownSchema = new Schema({
    title: {
        type: String
    },
    description: {
        type: String
    },
    category: {
        type: String
    },
    due: {
        type: Date
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { _id: true });


const money_record = new Schema({

    date:{
        type: Date
    },
    description:{
        type:String,
        default:"Not-Mentioned"
    },
    amount:{
        type:Number
    },
    category:{
        type:String,
        default:"Initial"
    }
});

//Money Manager
const montly = new Schema({

    month : {
        type: String,
        default:() => new Date().toISOString().slice(0, 7)
    },
    budget:{
        type:Number,
        default:2000
    },
    expense:{
        type:Number,
        default:0
    },
    balance:{
        type:Number,
        default:0
    },
    income:{
        type:Number,
        default:0
    },
    income_record: [money_record],
    expense_record:[money_record]
},{_id:false})



//main schema
const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    country: { type: String, required: true },

    to_do_list: {
        assignment: [taskSchema],
        exam: [taskSchema],
        project: [taskSchema],
        other: [taskSchema]
    },

    attendance: {
        subjects: [subjectAttendanceSchema]

    },

    exam_countdown: [countdownSchema],

    money_manager : [montly],
    currnet_month_exist: {
        type:Boolean
    }

});


module.exports = mongoose.model('USER_DATA', userSchema, 'USER_DATA');
