---
layout: post
title: Open source and Big Tech companies
url: /open_source_and_big_tech_companies
file_name: open_source_and_big_tech_companies
---

A number of large tech companies depend heavily on open source projects and communities—either using open source as the foundation of their infrastructure or open-sourcing key projects that they develop in-house. Below are some well-known examples of “big tech” organizations with significant open source endeavors (i.e., large-scale projects that require substantial effort) and a general overview of how to start contributing.

---

## 1. Google

**Major Projects:**

- **Kubernetes** (container orchestration)
- **TensorFlow** (machine learning framework)
- **Go (Golang)** (programming language)
- **Flutter** (UI toolkit)
- **Angular** (web application framework)
- **Bazel** (build system)

**Contribution Process Overview:**

1. **Find the project repo:** Most Google open source projects are hosted on GitHub (for example, [github.com/kubernetes/kubernetes](https://github.com/kubernetes/kubernetes), [github.com/tensorflow/tensorflow](https://github.com/tensorflow/tensorflow)).
2. **Read the contributing docs:** Look for a `CONTRIBUTING.md` file or similar guidelines in each repository.  
3. **Sign the CLA (Contributor License Agreement):** Google uses a CLA for code contributions to protect both the contributor and the project.
4. **Open pull requests:** Most Google projects follow the standard GitHub PR model. Start by forking the repo, making a local branch, committing changes, and submitting a pull request.

---

## 2. Microsoft

**Major Projects:**

- **.NET Platform** (runtime libraries, compiler, etc.)
- **TypeScript** (superset of JavaScript)
- **Visual Studio Code (VS Code)** (popular code editor)
- **PowerShell** (cross-platform shell and scripting language)

**Contribution Process Overview:**

1. **Pick a project on GitHub:** Microsoft hosts its open source efforts primarily on GitHub (e.g., [github.com/dotnet/runtime](https://github.com/dotnet/runtime), [github.com/Microsoft/TypeScript](https://github.com/Microsoft/TypeScript)).
2. **Review the guidelines:** Each repo has documentation like `CONTRIBUTING.md` and issue templates that outline coding standards, testing procedures, etc.
3. **Sign the Microsoft CLA:** Contributions typically require signing Microsoft’s CLA, which is a quick, one-time process.
4. **Look for “good first issue” or “help wanted” labels:** These labels highlight tasks that are beginner-friendly.

---

## 3. Meta (Facebook)

**Major Projects:**

- **React** and **React Native** (web and mobile frameworks)
- **PyTorch** (machine learning framework)
- **HHVM (HipHop Virtual Machine)** (PHP/Hack runtime)
- **Presto** (distributed SQL query engine)

**Contribution Process Overview:**

1. **Check out the project’s GitHub repo:** For example, [github.com/facebook/react](https://github.com/facebook/react) or [github.com/pytorch/pytorch](https://github.com/pytorch/pytorch).
2. **Read the contributing guidelines:** Detailed instructions exist for setting up the dev environment, running tests, style guides, etc.
3. **Sign the Meta CLA:** As with other large organizations, Meta requires contributors to sign a CLA.
4. **Open PRs and engage with maintainers:** They have active communities and typically respond to pull requests and issues quickly.

---

## 4. Amazon (AWS)

**Major Projects:**

- **AWS CDK** (Cloud Development Kit)
- **OpenSearch** (fork of Elasticsearch/Kibana)
- **Amazon Linux** (Linux distribution for AWS)
- **S2N** (implementation of the TLS/SSL protocols)

**Contribution Process Overview:**

1. **Locate the GitHub repo:** Projects like the AWS CDK and OpenSearch are at [github.com/aws](https://github.com/aws) or [github.com/opensearch-project](https://github.com/opensearch-project/).
2. **Check project docs & contributing guide:** This covers setup, testing, coding conventions, etc.
3. **Sign Amazon’s Contributor Agreement or DCO:** Some repos use a Developer Certificate of Origin (DCO), others use a CLA.
4. **Submit a pull request:** Fork the repo and create a branch for your changes, then make a PR.

---

## 5. Red Hat

**Major Projects:**

- **Fedora** (upstream distribution for RHEL)
- **CentOS Stream** (rolling release preview for RHEL)
- **Ansible** (IT automation platform)
- **Keycloak** (identity and access management)

**Contribution Process Overview:**

1. **Find the project home**: Red Hat often uses different platforms (e.g., [Pagure](https://pagure.io/), GitHub, or GitLab). Fedora, for instance, is on Pagure; many other Red Hat-led projects (like Ansible) are on GitHub.
2. **Join the community**: For distributions like Fedora or CentOS, you might first join mailing lists, IRC/Matrix channels, or discourse forums.
3. **Follow the contributor docs**: Each project has guidelines around coding style, packaging, testing, etc.
4. **Engage with maintainers**: Submit bug fixes, feature requests, or new packages following the project-specific submission workflow.

---

## 6. Netflix

**Major Projects:**

- **Simian Army / Chaos Monkey** (chaos engineering tools)
- **Spinnaker** (continuous delivery platform)
- **Hystrix** (latency and fault tolerance library for Java) – now in maintenance
- Numerous microservices frameworks and libraries

**Contribution Process Overview:**

1. **Check Netflix’s GitHub organization**: [github.com/Netflix](https://github.com/Netflix).
2. **Look for a CLA**: Netflix often uses a Contributor License Agreement; sign it if required.
3. **Follow standard GitHub workflows**: Fork, branch, PR.  
4. **Consult the `README` and `CONTRIBUTING.md`**: Some Netflix projects have unique build processes or test suites.

---

## 7. Others to Note

- **Intel** (contributions to the Linux kernel, Mesa drivers, Clear Linux)
- **Apple** (Swift, WebKit, etc. – though Apple is more selective in how it manages community input)
- **GitLab** (the Community Edition is open source; merges are done via GitLab.com)
- **Mozilla** (Firefox, Rust—though Rust is now under the Rust Foundation, it originated at Mozilla)

All these organizations maintain substantial, complex codebases with large communities, requiring significant engineering resources and community involvement to evolve.

---

# General Steps to Start Contributing Anywhere

Regardless of which company or project you choose, most open source contribution flows are similar:

1. **Pick a Project**  
   - Identify a repo that interests you or aligns with your skill set.
   - Evaluate if the community is active, welcoming, and well-documented.

2. **Read the Contribution Guidelines**  
   - This is usually in a `CONTRIBUTING.md` or similar file in the project’s root folder on GitHub.
   - Guides will often point you to “good first issues” or “help wanted” items.

3. **Set Up Your Environment**  
   - Clone the repository locally.
   - Install any required dependencies or build tools.
   - Run tests to ensure your environment is correct before making changes.

4. **Sign Any Required Agreements**  
   - Large corporations typically require you to sign a CLA or follow a DCO process (Developer Certificate of Origin).  
   - It’s a legal safeguard for both the contributor and the company.

5. **Pick an Issue / Plan a Contribution**  
   - Start small with a bug fix or documentation update.  
   - For bigger features, discuss with maintainers first via an issue or a design proposal.

6. **Create Your Fork & Branch**  
   - On GitHub or GitLab, fork the repo to your own account.
   - Create a branch for your changes (e.g., `feature/my-awesome-fix`).

7. **Implement, Commit, and Push**  
   - Follow the project’s coding style and commit message guidelines.  
   - Keep commits small and logical if possible.

8. **Open a Pull Request (PR)**  
   - Provide a clear description of what you changed and why.
   - Reference any related issues (e.g., “Fixes #1234”).
   - Include test results or steps to reproduce if relevant.

9. **Address Feedback**  
   - Maintainers and reviewers might request changes or improvements.
   - Be responsive: revise your PR accordingly and ask questions if unclear.

10. **Celebrate & Keep Contributing**  

- Once merged, your change is officially part of the project.
- Continue engaging with the community, and over time you might become a trusted maintainer.

---

### Key Takeaways

- **Major tech companies** like Google, Microsoft, Meta, Amazon, and Red Hat not only use open source software but also maintain large-scale open source projects.
- **Contribution processes** typically involve reading a project’s contributing docs, signing a CLA or DCO, and opening a pull request through GitHub (or an equivalent platform).
- **Start small**—fix a bug or improve documentation—then move on to more complex contributions once you understand the project’s norms and tooling.
- **Engagement with the community** is essential. Joining mailing lists, Discord/Slack groups, or discussion forums helps you learn the roadmap, coding standards, and how you can best contribute.
