# 🤝 Đóng góp cho Free Clouds

Cảm ơn bạn đã quan tâm đến việc đóng góp cho Free Clouds! Chúng tôi hoan nghênh mọi đóng góp từ community, từ bug reports đến feature implementations.

## 📋 Mục lục

- [Code of Conduct](#code-of-conduct)
- [Cách bắt đầu](#cách-bắt-đầu)
- [Development Setup](#development-setup)
- [Contribution Workflow](#contribution-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

Dự án này tuân theo [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/). Bằng việc tham gia, bạn đồng ý tuân theo các quy tắc này.

### Hành vi được khuyến khích:
- ✅ Sử dụng ngôn ngữ tích cực và inclusive
- ✅ Tôn trọng các quan điểm và kinh nghiệm khác nhau
- ✅ Chấp nhận constructive criticism một cách graceful
- ✅ Tập trung vào điều tốt nhất cho community
- ✅ Thể hiện empathy với các members khác

### Hành vi không được chấp nhận:
- ❌ Ngôn ngữ hoặc hình ảnh sexualized
- ❌ Trolling, insulting, hoặc derogatory comments
- ❌ Harassment công khai hoặc riêng tư
- ❌ Publishing thông tin private của người khác
- ❌ Hành vi unprofessional khác

## Cách bắt đầu

### Tôi mới với Open Source
- 📚 Đọc [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
- 🔍 Tìm các issues với label `good first issue` hoặc `beginner-friendly`
- 💬 Join [Discord community](https://discord.gg/freeclouds) để ask questions
- 📖 Đọc kỹ documentation và code structure

### Tôi có kinh nghiệm
- 🚀 Check [roadmap](README.md#roadmap) để xem priority features
- 🐛 Tìm các issues phức tạp cần giải quyết
- 💡 Propose new features hoặc improvements
- 👨‍🏫 Mentor các contributors mới

## Development Setup

### Prerequisites
- Node.js >= 18.0.0
- npm >= 8.0.0
- Git
- MongoDB (local hoặc Atlas)
- Telegram Bot Token

### Local Setup

```bash
# 1. Fork và clone repository
git clone https://github.com/yourusername/free-clouds-nextjs.git
cd free-clouds-nextjs

# 2. Add upstream remote
git remote add upstream https://github.com/original-author/free-clouds-nextjs.git

# 3. Install dependencies
npm install

# 4. Copy và config environment
cp .env.example .env.local
# Edit .env.local với thông tin của bạn

# 5. Setup database
npm run db:setup

# 6. Start development server
npm run dev
```

### Verify Setup

```bash
# Check linting
npm run lint

# Run tests
npm test

# Type checking
npm run type-check

# Build project
npm run build
```

## Contribution Workflow

### 1. Tìm hoặc tạo Issue
- 🔍 Search existing issues trước khi tạo mới
- 🏷️ Sử dụng appropriate labels
- 📝 Follow issue templates
- 💬 Discuss approach trước khi code

### 2. Create Branch
```bash
# Sync với upstream
git checkout main
git pull upstream main

# Tạo feature branch
git checkout -b feature/your-feature-name
# hoặc
git checkout -b fix/issue-number-description
```

### 3. Develop
- 📝 Write clean, readable code
- ✅ Add tests cho new functionality
- 📚 Update documentation nếu cần
- 🔧 Ensure all checks pass locally

### 4. Commit Changes
```bash
# Stage changes
git add .

# Commit với descriptive message
git commit -m "feat: add file sharing functionality"

# Push to your fork
git push origin feature/your-feature-name
```

### 5. Create Pull Request
- 📝 Use PR template
- 📋 Fill out checklist
- 🔗 Reference related issues
- 📸 Add screenshots nếu có UI changes

## Coding Standards

### TypeScript Guidelines
```typescript
// ✅ Good - Explicit types và descriptive names
interface FileUploadRequest {
  file: File;
  folderId?: string;
  isPublic: boolean;
}

export async function uploadFileToTelegram(
  request: FileUploadRequest
): Promise<UploadResult> {
  // Implementation...
}

// ❌ Bad - Any types và unclear names
function upload(data: any): any {
  // Implementation...
}
```

### React Components
```tsx
// ✅ Good - Functional component với proper typing
interface FileCardProps {
  file: FileDocument;
  onDelete: (fileId: string) => void;
  onShare: (fileId: string) => void;
}

export const FileCard: React.FC<FileCardProps> = ({
  file,
  onDelete,
  onShare
}) => {
  // Component logic...
  return (
    <div className="file-card">
      {/* JSX */}
    </div>
  );
};

// ❌ Bad - Class component without proper types
class FileCard extends Component {
  render() {
    return <div>{this.props.file.name}</div>;
  }
}
```

### API Routes
```typescript
// ✅ Good - Proper error handling và validation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = uploadSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error },
        { status: 400 }
      );
    }

    // Process request...
    const result = await processUpload(validation.data);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Styling Guidelines
```css
/* ✅ Good - Tailwind classes với consistent spacing */
<div className="flex flex-col gap-4 p-6 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-semibold text-gray-900">
    Upload Files
  </h2>
</div>

/* ❌ Bad - Inline styles và inconsistent naming */
<div style={{display: 'flex', padding: '24px', backgroundColor: 'white'}}>
  <h2 style={{fontSize: '20px', fontWeight: 'bold'}}>
    Upload Files
  </h2>
</div>
```

## Commit Guidelines

Chúng tôi follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Adding/updating tests
- `chore` - Maintenance tasks
- `perf` - Performance improvements
- `ci` - CI/CD changes

### Examples
```bash
# Feature
git commit -m "feat: add file sharing with expiration dates"

# Bug fix
git commit -m "fix: resolve upload timeout for large files"

# Documentation
git commit -m "docs: update API documentation for upload endpoint"

# Breaking change
git commit -m "feat!: redesign file upload API

BREAKING CHANGE: The upload endpoint now requires authentication"
```

### Commit Message Rules
- ✅ Use imperative mood ("add" not "added")
- ✅ Don't capitalize first letter
- ✅ No period at the end
- ✅ Limit subject line to 50 characters
- ✅ Separate subject và body với blank line
- ✅ Wrap body at 72 characters

## Pull Request Process

### PR Checklist
- [ ] 🌿 Branch is up-to-date với main
- [ ] ✅ All tests pass
- [ ] 🔍 Code follows style guidelines  
- [ ] 📝 Self-review completed
- [ ] 💬 Clear description of changes
- [ ] 📋 Related issues linked
- [ ] 📸 Screenshots added (nếu có UI changes)
- [ ] 📚 Documentation updated
- [ ] 🏷️ Appropriate labels added

### PR Template
```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix/feature causing existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots để show visual changes.

## Related Issues
Closes #issue_number
```

### Review Process
1. **Automated checks** - All CI checks must pass
2. **Code review** - Ít nhất 1 maintainer approval
3. **Testing** - Manual testing nếu cần
4. **Merge** - Squash và merge vào main

### Review Guidelines
- 🕐 Expect feedback trong 2-3 days
- 💬 Respond to feedback promptly  
- 🔄 Make requested changes
- ✨ Keep PRs focused và small
- 📋 Update PR description nếu scope changes

## Issue Guidelines

### Before Creating Issue
- 🔍 Search existing issues
- 📖 Check documentation
- 🧪 Try latest version
- 💬 Ask in community chat first

### Issue Types

#### Bug Reports
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
Add screenshots để help explain problem.

**Environment:**
- OS: [e.g. Windows 11]
- Browser: [e.g. Chrome 91]
- Node.js version: [e.g. 18.16.0]
- App version: [e.g. 1.2.0]
```

#### Feature Requests
```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
What you want to happen.

**Describe alternatives you've considered**
Other solutions you've considered.

**Additional context**
Add any other context về feature request here.
```

### Issue Labels
- 🐛 `bug` - Something isn't working
- ✨ `enhancement` - New feature request
- 📚 `documentation` - Documentation improvement
- 🆘 `help wanted` - Need community help
- 🌱 `good first issue` - Good cho newcomers
- 🔥 `priority: high` - High priority
- ⚠️ `breaking change` - Breaking change

## Testing

### Test Structure
```
__tests__/
├── components/           # Component tests
├── pages/               # Page tests
├── api/                 # API route tests
├── lib/                 # Utility function tests
└── e2e/                 # End-to-end tests
```

### Writing Tests
```typescript
// Component test example
describe('FileCard', () => {
  it('renders file name correctly', () => {
    const file = { id: '1', name: 'test.pdf', size: 1024 };
    render(<FileCard file={file} onDelete={jest.fn()} />);
    
    expect(screen.getByText('test.pdf')).toBeInTheDocument();
  });
  
  it('calls onDelete when delete button clicked', () => {
    const mockOnDelete = jest.fn();
    const file = { id: '1', name: 'test.pdf', size: 1024 };
    
    render(<FileCard file={file} onDelete={mockOnDelete} />);
    
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });
});
```

### Running Tests
```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report  
npm run test:coverage

# E2E tests
npm run test:e2e
```

### Test Guidelines
- ✅ Write tests cho new features
- ✅ Maintain high test coverage (>80%)
- ✅ Test both happy path và edge cases
- ✅ Mock external dependencies
- ✅ Use descriptive test names
- ✅ Follow AAA pattern (Arrange, Act, Assert)

## Documentation

### Types of Documentation
- 📖 **README.md** - Project overview và setup
- 📝 **API Documentation** - Endpoint specifications
- 🎨 **Component Documentation** - Storybook stories
- 🏗️ **Architecture Documentation** - System design
- 📋 **Changelog** - Release notes

### Writing Guidelines
- ✅ Use clear, simple language
- ✅ Provide practical examples
- ✅ Keep documentation current
- ✅ Include screenshots cho UI features
- ✅ Use proper Markdown formatting
- ✅ Add table of contents cho long documents

### Documentation Updates
- 📝 Update docs với code changes
- 🔄 Review docs during PR process
- ✨ Add examples cho new features
- 🐛 Fix outdated information
- 📸 Update screenshots when UI changes

## Release Process

### Versioning
Chúng tôi follow [Semantic Versioning](https://semver.org/):
- `MAJOR` - Breaking changes
- `MINOR` - New features, backwards compatible
- `PATCH` - Bug fixes, backwards compatible

### Release Checklist
- [ ] 📋 Update CHANGELOG.md
- [ ] 🏷️ Create git tag
- [ ] 📦 Build và test release
- [ ] 🚀 Deploy to staging
- [ ] ✅ Run smoke tests
- [ ] 🌐 Deploy to production
- [ ] 📢 Announce release

## Getting Help

### Channels
- 💬 [Discord Community](https://discord.gg/freeclouds)
- 📧 Email: contributors@freeclouds.dev
- 🐦 Twitter: [@freeclouds](https://twitter.com/freeclouds)
- 📋 [GitHub Discussions](https://github.com/username/free-clouds-nextjs/discussions)

### Maintainers
- [@maintainer1](https://github.com/maintainer1) - Project Lead
- [@maintainer2](https://github.com/maintainer2) - Backend Developer  
- [@maintainer3](https://github.com/maintainer3) - Frontend Developer

### Response Times
- 🐛 **Critical bugs**: 24 hours
- 🔧 **Regular issues**: 2-3 days
- ✨ **Feature requests**: 1 week
- 💬 **Community questions**: 24-48 hours

---

## 🎉 Cảm ơn bạn đã đóng góp!

Mọi đóng góp, dù lớn hay nhỏ, đều được trân trọng. Bằng việc contribute, bạn đang giúp xây dựng một tool tuyệt vời cho community! 

**Happy coding!** 🚀