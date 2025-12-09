/**
 * Lightweight runtime mock for @tanstack/react-query.
 * Provides just enough behavior for unit tests in frontend-core.
 */

class QueryClient {
  constructor(config = {}) {
    this.config = config;
  }

  invalidateQueries(_options) {
    // no-op for tests
  }
}

// Simple no-op implementations suitable for unit tests.
const useQuery = (options) => {
  // Execute queryFn to increase coverage for hooks that define it.
  if (options && typeof options.queryFn === 'function') {
    // Fire-and-forget; callers don't await useQuery itself in these tests.
    void options.queryFn();
  }

  return {
    data: undefined,
    error: null,
    isLoading: false,
    isFetching: false,
  };
};

const useMutation = (options = {}) => {
  const { mutationFn, onSuccess } = options;

  const mutate = (variables) => {
    if (typeof mutationFn === 'function') {
      void mutationFn(variables);
    }
    if (typeof onSuccess === 'function') {
      onSuccess();
    }
  };

  const mutateAsync = async (variables) => {
    if (typeof mutationFn === 'function') {
      await mutationFn(variables);
    }
    if (typeof onSuccess === 'function') {
      onSuccess();
    }
    return undefined;
  };

  return {
    mutate,
    mutateAsync,
    isPending: false,
  };
};

const defaultClient = new QueryClient();

const useQueryClient = () => defaultClient;

module.exports = {
  QueryClient,
  useQuery,
  useMutation,
  useQueryClient,
};


