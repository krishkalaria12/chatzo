module.exports = {
  // Basic formatting
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  
  // JSX specific
  jsxSingleQuote: true,
  jsxBracketSameLine: false,
  
  // Other options
  bracketSpacing: true,
  arrowParens: 'avoid',
  endOfLine: 'auto',
  
  // File-specific overrides
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always',
      },
    },
  ],
}; 