/**
 * MyCodeXvantaOS GitHub Connector
 * Provides integration with GitHub API
 */

export interface GitHubConfig {
  token: string;
  baseUrl?: string;
  timeout?: number;
}

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  bio: string | null;
  location: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  fork: boolean;
  owner: GitHubUser;
  language: string | null;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  user: GitHubUser;
  assignee: GitHubUser | null;
  labels: GitHubLabel[];
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  comments: number;
}

export interface GitHubLabel {
  id: number;
  name: string;
  color: string;
  description: string | null;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  user: GitHubUser;
  base: GitHubBranch;
  head: GitHubBranch;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  additions: number;
  deletions: number;
  changed_files: number;
}

export interface GitHubBranch {
  label: string;
  ref: string;
  sha: string;
  repo: GitHubRepository;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: GitHubUser | null;
  committer: GitHubUser | null;
  created_at: string;
}

export interface GitHubFile {
  filename: string;
  type: "file" | "dir" | "submodule" | "symlink";
  size: number | null;
  sha: string;
  url: string;
}

export class GitHubConnector {
  private config: Required<GitHubConfig>;
  private headers: Record<string, string>;

  constructor(config: GitHubConfig) {
    this.config = {
      token: config.token,
      baseUrl: config.baseUrl || "https://api.github.com",
      timeout: config.timeout || 30000,
    };

    this.headers = {
      Authorization: `token ${this.config.token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "MyCodeXvantaOS-GitHub-Connector",
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API Error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<T>;
  }

  private async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  }

  private async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  }

  private async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  }

  private async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: "DELETE",
    });
  }

  /**
   * Get authenticated user
   */
  async getUser(): Promise<GitHubUser> {
    return this.request<GitHubUser>("/user");
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<GitHubUser> {
    return this.request<GitHubUser>(`/users/${username}`);
  }

  /**
   * List user repositories
   */
  async getUserRepositories(
    username: string,
    options: {
      type?: "all" | "owner" | "member";
      sort?: "updated" | "created" | "pushed";
      per_page?: number;
    } = {}
  ): Promise<GitHubRepository[]> {
    const params = new URLSearchParams({
      type: options.type || "all",
      sort: options.sort || "updated",
      per_page: String(options.per_page || 30),
    });
    return this.request<GitHubRepository[]>(`/users/${username}/repos?${params}`);
  }

  /**
   * List authenticated user's repositories
   */
  async getMyRepositories(
    options: {
      type?: "all" | "owner" | "public" | "private";
      visibility?: "all" | "public" | "private";
    } = {}
  ): Promise<GitHubRepository[]> {
    const params = new URLSearchParams();
    if (options.type) params.set("type", options.type);
    if (options.visibility) params.set("visibility", options.visibility);
    return this.request<GitHubRepository[]>(`/user/repos?${params}`);
  }

  /**
   * Get repository
   */
  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    return this.request<GitHubRepository>(`/repos/${owner}/${repo}`);
  }

  /**
   * List repository issues
   */
  async getIssues(
    owner: string,
    repo: string,
    options: {
      state?: "open" | "closed" | "all";
      labels?: string;
      sort?: "created" | "updated" | "comments";
    } = {}
  ): Promise<GitHubIssue[]> {
    const params = new URLSearchParams({
      state: options.state || "open",
      sort: options.sort || "created",
    });
    if (options.labels) params.set("labels", options.labels);
    return this.request<GitHubIssue[]>(`/repos/${owner}/${repo}/issues?${params}`);
  }

  /**
   * Create issue
   */
  async createIssue(
    owner: string,
    repo: string,
    data: { title: string; body?: string; labels?: string[]; assignees?: string[] }
  ): Promise<GitHubIssue> {
    return this.post<GitHubIssue>(`/repos/${owner}/${repo}/issues`, data);
  }

  /**
   * Update issue
   */
  async updateIssue(
    owner: string,
    repo: string,
    issueNumber: number,
    data: { title?: string; body?: string; state?: "open" | "closed" }
  ): Promise<GitHubIssue> {
    return this.patch<GitHubIssue>(`/repos/${owner}/${repo}/issues/${issueNumber}`, data);
  }

  /**
   * List pull requests
   */
  async getPullRequests(
    owner: string,
    repo: string,
    options: { state?: "open" | "closed" | "all"; sort?: "created" | "updated" | "popularity" } = {}
  ): Promise<GitHubPullRequest[]> {
    const params = new URLSearchParams({
      state: options.state || "open",
      sort: options.sort || "created",
    });
    return this.request<GitHubPullRequest[]>(`/repos/${owner}/${repo}/pulls?${params}`);
  }

  /**
   * Create pull request
   */
  async createPullRequest(
    owner: string,
    repo: string,
    data: { title: string; body?: string; head: string; base: string }
  ): Promise<GitHubPullRequest> {
    return this.post<GitHubPullRequest>(`/repos/${owner}/${repo}/pulls`, data);
  }

  /**
   * Merge pull request
   */
  async mergePullRequest(
    owner: string,
    repo: string,
    pullNumber: number,
    options: { commit_title?: string; commit_message?: string } = {}
  ): Promise<any> {
    return this.put(`/repos/${owner}/${repo}/pulls/${pullNumber}/merge`, options);
  }

  /**
   * List commits
   */
  async getCommits(
    owner: string,
    repo: string,
    options: { sha?: string; path?: string; per_page?: number } = {}
  ): Promise<GitHubCommit[]> {
    const params = new URLSearchParams({
      per_page: String(options.per_page || 30),
    });
    if (options.sha) params.set("sha", options.sha);
    if (options.path) params.set("path", options.path);
    return this.request<GitHubCommit[]>(`/repos/${owner}/${repo}/commits?${params}`);
  }

  /**
   * Get commit
   */
  async getCommit(owner: string, repo: string, sha: string): Promise<any> {
    return this.request(`/repos/${owner}/${repo}/commits/${sha}`);
  }

  /**
   * List repository contents
   */
  async getContents(
    owner: string,
    repo: string,
    path: string = ""
  ): Promise<GitHubFile | GitHubFile[]> {
    return this.request(`/repos/${owner}/${repo}/contents/${path}`);
  }

  /**
   * Create or update file
   */
  async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    data: { message: string; content: string; sha?: string; branch?: string }
  ): Promise<any> {
    return this.put(`/repos/${owner}/${repo}/contents/${path}`, data);
  }

  /**
   * Delete file
   */
  async deleteFile(
    owner: string,
    repo: string,
    path: string,
    data: { message: string; sha: string; branch?: string }
  ): Promise<any> {
    return this.delete(
      `/repos/${owner}/${repo}/contents/${path}?message=${encodeURIComponent(data.message)}&sha=${data.sha}`
    );
  }

  /**
   * List branches
   */
  async getBranches(
    owner: string,
    repo: string,
    options: { protected?: boolean } = {}
  ): Promise<any[]> {
    const params = new URLSearchParams();
    if (options.protected !== undefined) params.set("protected", String(options.protected));
    return this.request(`/repos/${owner}/${repo}/branches?${params}`);
  }

  /**
   * Get branch
   */
  async getBranch(owner: string, repo: string, branch: string): Promise<any> {
    return this.request(`/repos/${owner}/${repo}/branches/${branch}`);
  }

  /**
   * Create repository
   */
  async createRepository(data: {
    name: string;
    description?: string;
    private?: boolean;
    auto_init?: boolean;
  }): Promise<GitHubRepository> {
    return this.post<GitHubRepository>("/user/repos", data);
  }

  /**
   * Create organization repository
   */
  async createOrganizationRepository(
    org: string,
    data: { name: string; description?: string; private?: boolean; auto_init?: boolean }
  ): Promise<GitHubRepository> {
    return this.post<GitHubRepository>(`/orgs/${org}/repos`, data);
  }

  /**
   * Delete repository
   */
  async deleteRepository(owner: string, repo: string): Promise<void> {
    await this.delete(`/repos/${owner}/${repo}`);
  }

  /**
   * Check rate limit status
   */
  async getRateLimit(): Promise<any> {
    return this.request("/rate_limit");
  }
}

export default GitHubConnector;
