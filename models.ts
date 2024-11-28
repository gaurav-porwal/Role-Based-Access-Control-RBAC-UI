import mongoose from 'mongoose';

// Define Permission Schema
const PermissionSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true 
  },
  description: { 
    type: String 
  }
});

// Define Role Schema
const RoleSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true 
  },
  permissions: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Permission' 
  }]
});

// Define User Schema
const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Role', 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export const Permission = mongoose.model('Permission', PermissionSchema);
export const Role = mongoose.model('Role', RoleSchema);
export const User = mongoose.model('User', UserSchema);
