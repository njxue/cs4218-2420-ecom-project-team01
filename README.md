# Milestone 1

### Set-up

1. Navigate to the project root and run `npm install`
1. Copy the contents of `sonar-project.properties.example` into a new file `sonar-project.properties` and replace `sonar.token` with your own token
1. Copy the contents of `.env.example` into a new file `.env` and replace `<your-mongodb-connection-string>` with your own MongoDB connection string
1. Run `cd client` and run `npm install`

### Run unit tests

- To run both **frontend and backend** tests, run `npm run test`
- To run **frontend** tests only, run `npm run test:frontend`
- To run **backend** tests only, run `npm run test:backend`

### Run integration tests

- To run both **frontend and backend** tests, run `npm run test:integration`
- To run **frontend** tests only, run `npm run test:integration:frontend`
- To run **backend** tests only, run `npm run test:integration:backend`

### Run UI tests with playwright

1. Navigate to the project root and run `npx playwright test`
1. The above command will automatically create the file `/playwright/.auth.json`. Verify that it exists
1. Run `npx playwright show-report` to view test results
1. If the `authenticate` setup fails, delete `/playwright/.auth.json` and repeat steps 1 to 3

### Start-up

1. To run the app locally, navigate to the project root and run `npm run dev`
1. If you're in development mode, verify that an admin user `cs4218@test.com` has been automatically created in your local MongoDB database
   - You should see `Admin user 'cs4218@test.com' created` or `Admin user 'cs4218@test.com' updated` in the terminal on project startup
1. Go to `http://localhost:3000/` on the browser to view the app
1. To login as admin, use the email `cs4218@test.com` and the password `cs4218@test.com`
1. If you encounter a `404` error in admin pages,  clear your browser's cache

### CI

Link to CI run: https://github.com/cs4218/cs4218-2420-ecom-project-team01/actions/runs/13792712709/job/38576528113?pr=15
