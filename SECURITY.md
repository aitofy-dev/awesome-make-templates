# Security Policy

## Reporting a vulnerability

Report vulnerabilities privately by email to **vted001@gmail.com**. Do not open a public
issue for a security problem.

Include what you found, how to reproduce it, and the impact you expect. You will get a first
reply within 72 hours and an estimate of when a fix will land.

## In scope

This repository ships Make.com scenario blueprints, documentation, and small validation
scripts. The most relevant reports are:

- A committed blueprint that leaks a credential, connection ID, real webhook URL, or
  personal data.
- A blueprint that, once imported, performs an action a user would not expect.
- A vulnerability in the scripts under `scripts/`.

Make.com's own platform is out of scope — report those to Make directly.
