const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const readline = require("readline");
require("dotenv").config({ path: ".env.local" });

// User schema (simplified version matching the model)
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    totalFilesUploaded: {
      type: Number,
      default: 0,
    },
    totalStorageUsed: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Helper function to prompt user input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Helper function to prompt password (hidden input)
function promptPassword(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let password = "";
    stdin.on("data", function (ch) {
      ch = ch + "";

      switch (ch) {
        case "\n":
        case "\r":
        case "\u0004":
          stdin.setRawMode(false);
          stdin.pause();
          stdout.write("\n");
          resolve(password);
          break;
        case "\u0003":
          process.exit();
          break;
        case "\u007f": // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            stdout.write("\b \b");
          }
          break;
        default:
          password += ch;
          stdout.write("*");
          break;
      }
    });
  });
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Main function to create admin user
async function createAdminUser() {
  try {
    console.log("🔧 Free Clouds - Admin User Setup");
    console.log("=====================================\n");

    // Connect to MongoDB
    const mongoUri = process.env.DATABASE_URL;
    if (!mongoUri) {
      console.error(
        "❌ Error: DATABASE_URL not found in environment variables",
      );
      console.log(
        "Please make sure your .env.local file contains DATABASE_URL",
      );
      process.exit(1);
    }

    console.log("📦 Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB successfully\n");

    // Check if any admin users already exist
    const existingAdmins = await User.countDocuments({ role: "admin" });

    if (existingAdmins > 0) {
      console.log(
        `⚠️  Warning: ${existingAdmins} admin user(s) already exist in the system.`,
      );
      const proceed = await prompt(
        "Do you want to create another admin user? (y/N): ",
      );

      if (proceed.toLowerCase() !== "y" && proceed.toLowerCase() !== "yes") {
        console.log("👋 Setup cancelled.");
        process.exit(0);
      }
      console.log("");
    }

    // Collect admin user information
    console.log("👤 Please provide admin user details:");
    console.log("────────────────────────────────────\n");

    let name = "";
    while (!name.trim()) {
      name = await prompt("Full Name: ");
      if (!name.trim()) {
        console.log("❌ Name cannot be empty. Please try again.\n");
      }
    }

    let email = "";
    while (!email.trim() || !isValidEmail(email.trim())) {
      email = await prompt("Email Address: ");
      if (!email.trim()) {
        console.log("❌ Email cannot be empty. Please try again.\n");
      } else if (!isValidEmail(email.trim())) {
        console.log("❌ Invalid email format. Please try again.\n");
      }
    }
    email = email.toLowerCase().trim();

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`❌ Error: A user with email "${email}" already exists.`);

      if (existingUser.role === "admin") {
        console.log("This user is already an admin.");
      } else {
        const makeAdmin = await prompt(
          "This user exists as a regular user. Make them admin? (y/N): ",
        );
        if (
          makeAdmin.toLowerCase() === "y" ||
          makeAdmin.toLowerCase() === "yes"
        ) {
          existingUser.role = "admin";
          existingUser.isActive = true;
          await existingUser.save();
          console.log("✅ User has been promoted to admin successfully!");
          process.exit(0);
        }
      }
      process.exit(1);
    }

    let password = "";
    let confirmPassword = "";

    while (password.length < 8 || password !== confirmPassword) {
      password = await promptPassword("Password (min 8 characters): ");

      if (password.length < 8) {
        console.log(
          "❌ Password must be at least 8 characters long. Please try again.\n",
        );
        continue;
      }

      confirmPassword = await promptPassword("Confirm Password: ");

      if (password !== confirmPassword) {
        console.log("❌ Passwords do not match. Please try again.\n");
      }
    }

    console.log("\n🔐 Creating admin user...");

    // Hash the password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create the admin user
    const adminUser = new User({
      name: name.trim(),
      email: email,
      passwordHash: passwordHash,
      role: "admin",
      isActive: true,
      totalFilesUploaded: 0,
      totalStorageUsed: 0,
    });

    await adminUser.save();

    console.log("✅ Admin user created successfully!\n");
    console.log("📋 Admin User Details:");
    console.log("──────────────────────");
    console.log(`Name: ${adminUser.name}`);
    console.log(`Email: ${adminUser.email}`);
    console.log(`Role: Admin`);
    console.log(`Created: ${adminUser.createdAt.toLocaleString()}\n`);

    console.log("🎉 Setup completed! You can now:");
    console.log("1. Start your application: npm run dev");
    console.log("2. Visit: http://localhost:3000/login");
    console.log("3. Login with the admin credentials");
    console.log("4. Access admin panel: http://localhost:3000/admin\n");

    console.log("🔐 Security Notes:");
    console.log("- Keep your admin credentials secure");
    console.log("- Consider enabling 2FA in production");
    console.log("- Regularly review admin access logs");
    console.log("- Change default passwords in production");
  } catch (error) {
    console.error("\n❌ Error creating admin user:", error.message);

    if (error.code === 11000) {
      console.log("This email address is already registered.");
    }

    process.exit(1);
  } finally {
    rl.close();
    await mongoose.disconnect();
    console.log("\n📦 Disconnected from MongoDB");
  }
}

// Handle process interruption
process.on("SIGINT", async () => {
  console.log("\n\n👋 Setup interrupted by user");
  rl.close();
  await mongoose.disconnect();
  process.exit(0);
});

// Run the script
console.log("Starting admin user setup...\n");
createAdminUser().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
