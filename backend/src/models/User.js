const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema= new mongoose.Schema(
    {
        name: {
            type: String, 
            required: [true, 'Name is required'],
            trim: true,
            maxlength: [60, 'Name cannot exceed 60 characters']
        },

        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
        },

        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be atleast 6 characters'],
            select: false, // Exclusive password by default when querying users
        },
    },
    {
        timestamps: true,
    }
);

// Hash password automatically before saving if it was created or modified

userSchema.pre('save', async function(next){
    if(!this.isModified('password')) return next();
    
    const salt= await bcrypt.genSalt(10);
    this.password= await bcrypt.hash(this.password, salt);
  
});


// Instance method to verify password during login
userSchema.methods.comparePassword= async function(candidatePassword){
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports=mongoose.model('User', userSchema);