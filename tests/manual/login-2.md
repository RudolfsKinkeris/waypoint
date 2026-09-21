# Login (Login Regression Suite)

Assumption: neither Username nor Password has a documented min/max length in this project. For boundary-value analysis, the following reasonable limits are assumed and stated in each relevant test case's preconditions:
- Username: min length 1, max length 50 characters.
- Password: min length 1, max length 64 characters.

## Happy Path

### Login Succeeds With Valid Username and Password

**Preconditions:** A registered user account exists with a known valid username and password. The Log In screen is open.

**Steps:**
1. Enter the registered username into the Username field.
2. Enter the correct password into the Password field.
3. Click the "Log In" button.

**Expected Result:** The user is redirected to the Main page, with their username displayed at the top right corner.

**Severity:** Critical

**Priority:** High

**Status:** draft

## Boundary Values

### Username Field Accepts Minimum Length (1 Character)

**Preconditions:** Assumed minimum username length is 1 character. A registered user account exists with a 1-character username and a known valid password. The Log In screen is open.

**Steps:**
1. Enter the 1-character username into the Username field.
2. Enter the correct password into the Password field.
3. Click the "Log In" button.

**Expected Result:** The user is redirected to the Main page, with their username displayed at the top right corner.

**Severity:** Minor

**Priority:** Low

**Status:** draft

### Username Field Accepts Maximum Length (50 Characters)

**Preconditions:** Assumed maximum username length is 50 characters. A registered user account exists with a 50-character username and a known valid password. The Log In screen is open.

**Steps:**
1. Enter the 50-character username into the Username field.
2. Enter the correct password into the Password field.
3. Click the "Log In" button.

**Expected Result:** The user is redirected to the Main page, with their username displayed at the top right corner.

**Severity:** Minor

**Priority:** Low

**Status:** draft

### Username Field Rejects Empty Value

**Preconditions:** The Log In screen is open. Username is a required field.

**Steps:**
1. Leave the Username field empty.
2. Enter a valid password into the Password field.
3. Click the "Log In" button.

**Expected Result:** A validation error message is shown and the user stays on the Log In screen.

**Severity:** Major

**Priority:** High

**Status:** draft

### Username Field Rejects Whitespace-Only Value

**Preconditions:** The Log In screen is open. Username is a required field.

**Steps:**
1. Enter a string of spaces only (e.g. "   ") into the Username field.
2. Enter a valid password into the Password field.
3. Click the "Log In" button.

**Expected Result:** A validation error message is shown (whitespace-only is treated as empty) and the user stays on the Log In screen.

**Severity:** Minor

**Priority:** Medium

**Status:** draft

### Username Field Handles Very Long Value (500+ Characters)

**Preconditions:** Assumed maximum username length is 50 characters. The Log In screen is open.

**Steps:**
1. Enter a 500-character string into the Username field.
2. Enter a valid password into the Password field.
3. Click the "Log In" button.

**Expected Result:** The input is either rejected with a clear validation error or safely truncated to the maximum length with no crash, layout break, or unhandled error; the user is not logged in with an invalid/overlong username.

**Severity:** Minor

**Priority:** Low

**Status:** draft

### Password Field Accepts Minimum Length (1 Character)

**Preconditions:** Assumed minimum password length is 1 character. A registered user account exists with a valid username and a 1-character password. The Log In screen is open.

**Steps:**
1. Enter the registered username into the Username field.
2. Enter the 1-character password into the Password field.
3. Click the "Log In" button.

**Expected Result:** The user is redirected to the Main page, with their username displayed at the top right corner.

**Severity:** Minor

**Priority:** Low

**Status:** draft

### Password Field Accepts Maximum Length (64 Characters)

**Preconditions:** Assumed maximum password length is 64 characters. A registered user account exists with a valid username and a 64-character password. The Log In screen is open.

**Steps:**
1. Enter the registered username into the Username field.
2. Enter the 64-character password into the Password field.
3. Click the "Log In" button.

**Expected Result:** The user is redirected to the Main page, with their username displayed at the top right corner.

**Severity:** Minor

**Priority:** Low

**Status:** draft

### Password Field Rejects Empty Value

**Preconditions:** The Log In screen is open. Password is a required field.

**Steps:**
1. Enter a valid username into the Username field.
2. Leave the Password field empty.
3. Click the "Log In" button.

**Expected Result:** A validation error message is shown and the user stays on the Log In screen.

**Severity:** Major

**Priority:** High

**Status:** draft

### Password Field Rejects Whitespace-Only Value

**Preconditions:** The Log In screen is open. Password is a required field.

**Steps:**
1. Enter a valid username into the Username field.
2. Enter a string of spaces only (e.g. "   ") into the Password field.
3. Click the "Log In" button.

**Expected Result:** A validation error message is shown (whitespace-only is treated as empty) and the user stays on the Log In screen.

**Severity:** Minor

**Priority:** Medium

**Status:** draft

### Password Field Handles Very Long Value (500+ Characters)

**Preconditions:** Assumed maximum password length is 64 characters. The Log In screen is open.

**Steps:**
1. Enter a valid username into the Username field.
2. Enter a 500-character string into the Password field.
3. Click the "Log In" button.

**Expected Result:** The input is either rejected with a clear validation error or safely handled up to the maximum length with no crash, layout break, or unhandled error; the user is not logged in with an invalid/overlong password.

**Severity:** Minor

**Priority:** Low

**Status:** draft

## Equivalence Partitions

### Login Fails With Valid Username Format but Incorrect Password

**Preconditions:** A registered user account exists with a known username. The Log In screen is open.

**Steps:**
1. Enter the registered username into the Username field.
2. Enter an incorrect password into the Password field.
3. Click the "Log In" button.

**Expected Result:** An error message is shown indicating invalid credentials, and the user stays on the Log In screen.

**Severity:** Critical

**Priority:** High

**Status:** draft

### Login Fails With Non-Existent Username and Any Password

**Preconditions:** The Log In screen is open. The entered username does not correspond to any registered account.

**Steps:**
1. Enter a username that does not exist in the system into the Username field.
2. Enter any password into the Password field.
3. Click the "Log In" button.

**Expected Result:** An error message is shown indicating invalid credentials, and the user stays on the Log In screen. The error message does not reveal whether the username exists.

**Severity:** Critical

**Priority:** High

**Status:** draft

### Login Succeeds With Username Containing Special Characters (Valid Partition)

**Preconditions:** A registered user account exists whose username contains characters such as a period, hyphen, or underscore (e.g. "jane.doe-1"), with a known valid password. The Log In screen is open.

**Steps:**
1. Enter the registered username (containing special characters) into the Username field.
2. Enter the correct password into the Password field.
3. Click the "Log In" button.

**Expected Result:** The user is redirected to the Main page, with their username displayed at the top right corner.

**Severity:** Minor

**Priority:** Medium

**Status:** draft

### Password Field Masks Input as It Is Typed

**Preconditions:** The Log In screen is open.

**Steps:**
1. Click into the Password field.
2. Type a password value character by character.

**Expected Result:** Each character is displayed as a masked character (e.g. a dot or asterisk) rather than plain text, at all times.

**Severity:** Major

**Priority:** Medium

**Status:** draft

### Login Fails With Username and Password Values Swapped

**Preconditions:** A registered user account exists with a known username and password. The Log In screen is open.

**Steps:**
1. Enter the registered password into the Username field.
2. Enter the registered username into the Password field.
3. Click the "Log In" button.

**Expected Result:** An error message is shown indicating invalid credentials, and the user stays on the Log In screen.

**Severity:** Minor

**Priority:** Low

**Status:** draft

## Negative Cases

### Login Fails When Both Username and Password Are Missing

**Preconditions:** The Log In screen is open. Both fields are required.

**Steps:**
1. Leave the Username field empty.
2. Leave the Password field empty.
3. Click the "Log In" button.

**Expected Result:** A validation error message is shown for the required fields, and the user stays on the Log In screen.

**Severity:** Major

**Priority:** High

**Status:** draft

### Log In Button Submission Blocked by Client-Side Validation Without a Request to the Server

**Preconditions:** The Log In screen is open. Browser developer tools/network monitoring is available.

**Steps:**
1. Leave the Username and/or Password field empty.
2. Click the "Log In" button.
3. Observe the network traffic.

**Expected Result:** No login request is sent to the server for incomplete input; the error is caught by client-side validation and the user stays on the Log In screen.

**Severity:** Minor

**Priority:** Medium

**Status:** draft

### Login API Returns Documented Error Response Shape on Failure

**Preconditions:** The Log In screen is open. Access to inspect the raw API response is available (e.g. via browser dev tools).

**Steps:**
1. Enter an incorrect username and/or password into the Username and Password fields.
2. Click the "Log In" button.
3. Inspect the raw response returned by the login endpoint.

**Expected Result:** The response follows the project's standard shape `{ "success": boolean, "data": any, "error": string | null }`, with `success: false` and a non-null, human-readable `error` message; the UI surfaces that error message to the user.

**Severity:** Major

**Priority:** Medium

**Status:** draft

### Login Rejects Script Injection Attempt in Username Field

**Preconditions:** The Log In screen is open.

**Steps:**
1. Enter a script-injection payload (e.g. `<script>alert(1)</script>`) into the Username field.
2. Enter any value into the Password field.
3. Click the "Log In" button.

**Expected Result:** The login attempt fails with a standard invalid-credentials error (or validation error); the payload is not executed and is not reflected unescaped anywhere in the page.

**Severity:** Major

**Priority:** Medium

**Status:** draft

### Login Handles Wrong Data Type Submitted via Direct API Call

**Preconditions:** The login API endpoint is reachable directly (e.g. via a REST client), bypassing the UI form.

**Steps:**
1. Send a login request directly to the API with the `username` field set to a number (e.g. `12345`) instead of a string.
2. Include a valid string value for `password`.
3. Submit the request.

**Expected Result:** The server returns a `success: false` response with a descriptive `error` message (e.g. invalid input type) and does not crash or return a 500-level unhandled error.

**Severity:** Major

**Priority:** Medium

**Status:** draft

### Login Handles Missing Required Field via Direct API Call

**Preconditions:** The login API endpoint is reachable directly (e.g. via a REST client), bypassing the UI form.

**Steps:**
1. Send a login request directly to the API with the `password` field omitted entirely.
2. Include a valid `username` value.
3. Submit the request.

**Expected Result:** The server returns a `success: false` response with a descriptive `error` message indicating the missing required field, and does not crash or return a 500-level unhandled error.

**Severity:** Major

**Priority:** Medium

**Status:** draft
