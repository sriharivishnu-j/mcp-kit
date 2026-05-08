module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^chalk$': '<rootDir>/test/mocks/chalk.ts',
    '^boxen$': '<rootDir>/test/mocks/boxen.ts'
  }
};
