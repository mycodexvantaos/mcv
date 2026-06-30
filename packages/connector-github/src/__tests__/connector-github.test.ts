/**
 * GitHub Connector Tests
 */

import { GitHubConnector, GitHubConfig, GitHubUser, GitHubRepository } from "../index";

describe("GitHubConnector", () => {
  let connector: GitHubConnector;
  let mockFetch: jest.Mock;
  let config: GitHubConfig;

  beforeEach(() => {
    config = {
      token: "test-token",
      baseUrl: "https://api.github.com",
      timeout: 30000,
    };

    // Mock fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    connector = new GitHubConnector(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Initialization", () => {
    test("should create connector with config", () => {
      expect(connector).toBeInstanceOf(GitHubConnector);
    });

    test("should use default baseUrl when not provided", () => {
      const defaultConnector = new GitHubConnector({ token: "test" });
      expect(defaultConnector).toBeInstanceOf(GitHubConnector);
    });
  });

  describe("User Operations", () => {
    test("should get authenticated user", async () => {
      const mockUser: GitHubUser = {
        id: 1,
        login: "testuser",
        name: "Test User",
        email: "test@example.com",
        avatar_url: "https://example.com/avatar.png",
        bio: null,
        location: null,
        public_repos: 10,
        followers: 5,
        following: 3,
        created_at: "2020-01-01T00:00:00Z",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      const user = await connector.getUser();
      expect(user).toEqual(mockUser);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.github.com/user",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "token test-token",
          }),
        })
      );
    });

    test("should get user by username", async () => {
      const mockUser: GitHubUser = {
        id: 1,
        login: "octocat",
        name: "Octo Cat",
        email: "octocat@example.com",
        avatar_url: "https://example.com/octocat.png",
        bio: null,
        location: null,
        public_repos: 5,
        followers: 10,
        following: 2,
        created_at: "2020-01-01T00:00:00Z",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      const user = await connector.getUserByUsername("octocat");
      expect(user.login).toBe("octocat");
    });
  });

  describe("Repository Operations", () => {
    test("should get user repositories", async () => {
      const mockRepos: GitHubRepository[] = [
        {
          id: 1,
          name: "repo1",
          full_name: "user/repo1",
          description: "Test repo 1",
          private: false,
          fork: false,
          owner: {} as any,
          language: "TypeScript",
          default_branch: "main",
          created_at: "2020-01-01T00:00:00Z",
          updated_at: "2020-01-01T00:00:00Z",
          pushed_at: "2020-01-01T00:00:00Z",
          size: 100,
          stargazers_count: 5,
          watchers_count: 5,
          forks_count: 2,
          open_issues_count: 1,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRepos,
      });

      const repos = await connector.getUserRepositories("testuser");
      expect(repos).toHaveLength(1);
      expect(repos[0].name).toBe("repo1");
    });

    test("should get my repositories", async () => {
      const mockRepos: GitHubRepository[] = [];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRepos,
      });

      const repos = await connector.getMyRepositories();
      expect(Array.isArray(repos)).toBe(true);
    });

    test("should get repository", async () => {
      const mockRepo: GitHubRepository = {
        id: 1,
        name: "test-repo",
        full_name: "owner/test-repo",
        description: "Test repository",
        private: false,
        fork: false,
        owner: {} as any,
        language: "TypeScript",
        default_branch: "main",
        created_at: "2020-01-01T00:00:00Z",
        updated_at: "2020-01-01T00:00:00Z",
        pushed_at: "2020-01-01T00:00:00Z",
        size: 100,
        stargazers_count: 10,
        watchers_count: 10,
        forks_count: 5,
        open_issues_count: 2,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRepo,
      });

      const repo = await connector.getRepository("owner", "test-repo");
      expect(repo.name).toBe("test-repo");
    });

    test("should create repository", async () => {
      const mockRepo: GitHubRepository = {
        id: 1,
        name: "new-repo",
        full_name: "user/new-repo",
        description: "New repository",
        private: false,
        fork: false,
        owner: {} as any,
        language: null,
        default_branch: "main",
        created_at: "2020-01-01T00:00:00Z",
        updated_at: "2020-01-01T00:00:00Z",
        pushed_at: null,
        size: 0,
        stargazers_count: 0,
        watchers_count: 0,
        forks_count: 0,
        open_issues_count: 0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRepo,
      });

      const repo = await connector.createRepository({
        name: "new-repo",
        description: "New repository",
        private: false,
      });

      expect(repo.name).toBe("new-repo");
    });
  });

  describe("Issue Operations", () => {
    test("should get issues", async () => {
      const mockIssues: Record<string, unknown>[] = [];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockIssues,
      });

      const issues = await connector.getIssues("owner", "repo");
      expect(Array.isArray(issues)).toBe(true);
    });

    test("should create issue", async () => {
      const mockIssue = {
        id: 1,
        number: 1,
        title: "Test issue",
        body: "Issue description",
        state: "open" as const,
        user: {} as any,
        assignee: null,
        labels: [],
        created_at: "2020-01-01T00:00:00Z",
        updated_at: "2020-01-01T00:00:00Z",
        closed_at: null,
        comments: 0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockIssue,
      });

      const issue = await connector.createIssue("owner", "repo", {
        title: "Test issue",
        body: "Issue description",
      });

      expect(issue.title).toBe("Test issue");
    });

    test("should update issue", async () => {
      const mockIssue = {
        id: 1,
        number: 1,
        title: "Updated issue",
        body: "Updated description",
        state: "closed" as const,
        user: {} as any,
        assignee: null,
        labels: [],
        created_at: "2020-01-01T00:00:00Z",
        updated_at: "2020-01-01T00:00:00Z",
        closed_at: "2020-01-02T00:00:00Z",
        comments: 0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockIssue,
      });

      const issue = await connector.updateIssue("owner", "repo", 1, {
        title: "Updated issue",
        state: "closed",
      });

      expect(issue.title).toBe("Updated issue");
      expect(issue.state).toBe("closed");
    });
  });

  describe("Pull Request Operations", () => {
    test("should get pull requests", async () => {
      const mockPRs: Record<string, unknown>[] = [];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPRs,
      });

      const prs = await connector.getPullRequests("owner", "repo");
      expect(Array.isArray(prs)).toBe(true);
    });

    test("should create pull request", async () => {
      const mockPR = {
        id: 1,
        number: 1,
        title: "Test PR",
        body: "PR description",
        state: "open" as const,
        user: {} as any,
        base: { label: "owner:main", ref: "main", sha: "abc123", repo: {} as any },
        head: { label: "owner:feature", ref: "feature", sha: "def456", repo: {} as any },
        created_at: "2020-01-01T00:00:00Z",
        updated_at: "2020-01-01T00:00:00Z",
        merged_at: null,
        additions: 10,
        deletions: 5,
        changed_files: 2,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPR,
      });

      const pr = await connector.createPullRequest("owner", "repo", {
        title: "Test PR",
        body: "PR description",
        head: "feature",
        base: "main",
      });

      expect(pr.title).toBe("Test PR");
    });
  });

  describe("Commit Operations", () => {
    test("should get commits", async () => {
      const mockCommits: Record<string, unknown>[] = [];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCommits,
      });

      const commits = await connector.getCommits("owner", "repo");
      expect(Array.isArray(commits)).toBe(true);
    });

    test("should get commit", async () => {
      const mockCommit = {
        sha: "abc123",
        message: "Test commit",
        author: null,
        committer: null,
        created_at: "2020-01-01T00:00:00Z",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCommit,
      });

      const commit = await connector.getCommit("owner", "repo", "abc123");
      expect(commit.sha).toBe("abc123");
    });
  });

  describe("File Operations", () => {
    test("should get contents", async () => {
      const mockContent = {
        filename: "test.ts",
        type: "file" as const,
        size: 100,
        sha: "abc123",
        url: "https://api.github.com/repos/owner/repo/contents/test.ts",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockContent,
      });

      const content = await connector.getContents("owner", "repo", "test.ts");
      expect(content).toEqual(mockContent);
    });

    test("should create or update file", async () => {
      const mockResponse = {
        content: {
          sha: "def456",
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await connector.createOrUpdateFile("owner", "repo", "test.ts", {
        message: "Create file",
        content: "content",
      });

      expect(response).toBeDefined();
    });
  });

  describe("Branch Operations", () => {
    test("should get branches", async () => {
      const mockBranches: Record<string, unknown>[] = [];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBranches,
      });

      const branches = await connector.getBranches("owner", "repo");
      expect(Array.isArray(branches)).toBe(true);
    });

    test("should get branch", async () => {
      const mockBranch = {
        name: "main",
        commit: { sha: "abc123" },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBranch,
      });

      const branch = await connector.getBranch("owner", "repo", "main");
      expect(branch.name).toBe("main");
    });
  });

  describe("Error Handling", () => {
    test("should handle API errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => "Not Found",
      });

      await expect(connector.getUser()).rejects.toThrow("GitHub API Error");
    });
  });

  describe("Rate Limit", () => {
    test("should get rate limit status", async () => {
      const mockRateLimit = {
        resources: {
          core: {
            limit: 5000,
            remaining: 4999,
            reset: 1234567890,
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRateLimit,
      });

      const rateLimit = await connector.getRateLimit();
      expect(rateLimit).toBeDefined();
    });
  });
});
