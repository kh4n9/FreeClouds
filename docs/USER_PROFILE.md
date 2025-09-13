# User Profile Management

## Overview

The Free Clouds application includes comprehensive user profile management functionality that allows users to update their personal information, change passwords, and view account statistics.

## Features

### 1. Profile Information
- **Name**: Update your display name
- **Email**: Change your email address (must be unique)
- **Account Details**: View creation date and last update

### 2. Password Management
- **Change Password**: Update your account password securely
- **Password Requirements**: Minimum 8 characters
- **Current Password Verification**: Required for security

### 3. Account Statistics
- **Storage Usage**: View total storage used and available
- **File Count**: See total number of files uploaded
- **Folder Count**: Track total folders created
- **Usage Progress**: Visual progress bar showing storage utilization

### 4. Account Management
- **Account Information**: View user ID and account details
- **Danger Zone**: Access to account deletion (placeholder for future implementation)

## How to Access

1. **From Dashboard**: Click on your profile avatar in the top-right corner
2. **Select Settings**: Choose "Settings" from the dropdown menu
3. **Navigate Tabs**: Use the tabs to switch between Profile, Password, and Account sections

## API Endpoints

### Get User Profile
```http
GET /api/user
```
Returns user information including statistics:
- Basic profile data (name, email, dates)
- Storage statistics (files, folders, size)

### Update Profile
```http
PATCH /api/user
Content-Type: application/json

{
  "action": "update-profile",
  "name": "New Name",
  "email": "new@email.com"
}
```

### Change Password
```http
PATCH /api/user
Content-Type: application/json

{
  "action": "change-password",
  "currentPassword": "current_password",
  "newPassword": "new_password",
  "confirmPassword": "new_password"
}
```

## Security Features

### Authentication
- **JWT Validation**: All requests require valid authentication
- **CSRF Protection**: Origin validation for state-changing operations
- **Password Hashing**: Secure bcrypt hashing with salt rounds

### Validation
- **Email Uniqueness**: Prevents duplicate email addresses
- **Input Sanitization**: Trim and validate all inputs
- **Password Strength**: Minimum length requirements

### Authorization
- **Owner Verification**: Users can only modify their own profiles
- **Session Management**: Proper session handling and logout

## User Interface

### Modal Design
- **Responsive**: Works on desktop and mobile devices
- **Tabbed Interface**: Clean separation of different settings
- **Real-time Feedback**: Success and error messages
- **Loading States**: Visual feedback during operations

### Form Features
- **Auto-fill**: Current data pre-populated
- **Validation**: Client-side and server-side validation
- **Password Visibility**: Toggle password visibility
- **Progress Indicators**: Loading spinners and status updates

## Error Handling

### Common Errors
- **Email Already Taken**: When updating to an existing email
- **Invalid Password**: When current password is incorrect
- **Network Errors**: Connection issues and timeouts
- **Validation Errors**: Field-specific error messages

### Error Display
- **Contextual Messages**: Errors shown near relevant fields
- **Color Coding**: Red for errors, green for success
- **Dismissible**: Users can clear messages by taking action

## Storage Statistics

### Metrics Tracked
- **Total Files**: Count of all uploaded files
- **Total Folders**: Count of all created folders
- **Storage Used**: Total size in bytes (displayed as MB)
- **Storage Limit**: Currently set to 100MB per user

### Progress Visualization
- **Progress Bar**: Visual representation of storage usage
- **Percentage**: Calculated storage utilization
- **Detailed Breakdown**: Files, folders, and size separately

## Best Practices

### For Users
1. **Strong Passwords**: Use complex passwords with mix of characters
2. **Regular Updates**: Keep profile information current
3. **Storage Management**: Monitor storage usage regularly
4. **Secure Email**: Use a secure, accessible email address

### For Developers
1. **Input Validation**: Always validate on both client and server
2. **Error Handling**: Provide clear, actionable error messages
3. **Security**: Never expose sensitive data in responses
4. **Performance**: Optimize database queries for statistics

## Future Enhancements

### Planned Features
- **Account Deletion**: Complete account removal functionality
- **Profile Pictures**: Avatar upload and management
- **Two-Factor Authentication**: Enhanced security options
- **Storage Upgrade**: Premium storage plans
- **Activity Logs**: Track account activity and changes

### API Improvements
- **Rate Limiting**: Prevent abuse of profile update endpoints
- **Audit Trail**: Log all profile changes for security
- **Bulk Operations**: Efficient handling of multiple updates
- **Webhooks**: Notify external services of profile changes

## Troubleshooting

### Common Issues

**"Email already taken" error**
- Solution: Choose a different email address or contact support

**"Current password incorrect" error**
- Solution: Verify you're entering the correct current password
- Reset password if forgotten

**Profile not updating**
- Solution: Check network connection and try again
- Refresh page and retry

**Storage statistics not loading**
- Solution: Refresh the profile modal or page
- Check if files/folders are properly uploaded

### Support
For additional support or bug reports, please contact the development team or create an issue in the project repository.