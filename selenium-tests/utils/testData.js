module.exports = {
  validCredentials: {
    email: 'alex.morgan@example.com',
    password: 'SecurePassword123!',
    fullName: 'Alex Morgan',
    phone: '+15550192834'
  },
  invalidCredentials: [
    { email: '', password: '', desc: 'Empty username and password' },
    { email: 'nonexistent@brushiq.com', password: 'Password123!', desc: 'Unregistered user' },
    { email: 'alex.morgan@example.com', password: 'WrongPassword!', desc: 'Invalid password' },
    { email: 'invalid-email-format', password: 'Password123!', desc: 'Malformed email format' },
    { email: 'test@', password: 'Short', desc: 'Incomplete email format' }
  ],
  registrationData: {
    valid: {
      fullName: 'Sarah Connor',
      email: 'sarah.connor@sky.net',
      phone: '+15559876543',
      password: 'Terminator2029!'
    },
    shortPassword: {
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '+15551234567',
      password: '123'
    },
    missingName: {
      fullName: '',
      email: 'noname@example.com',
      phone: '+15551234567',
      password: 'Password123!'
    }
  },
  toothbrushData: {
    newBrush: {
      name: 'Sonicare DiamondClean',
      brand: 'Philips Sonicare',
      model: 'HX9911',
      bristleType: 'Soft',
      purchaseDate: '2026-06-01'
    },
    updateBrush: {
      name: 'Oral-B Genius X Pro',
      brand: 'Oral-B',
      model: 'Special Edition'
    }
  },
  familyMemberData: {
    child: {
      name: 'Leo Morgan',
      relation: 'Son',
      age: 7,
      avatarColor: 'blue'
    },
    spouse: {
      name: 'Emma Morgan',
      relation: 'Spouse',
      age: 32,
      avatarColor: 'purple'
    }
  },
  reminderData: {
    morning: {
      title: 'Morning Routine',
      time: '08:00',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    night: {
      title: 'Night Deep Clean',
      time: '21:30',
      days: ['Mon', 'Wed', 'Fri']
    }
  }
};
