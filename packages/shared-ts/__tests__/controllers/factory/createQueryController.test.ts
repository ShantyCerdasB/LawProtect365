import { createQueryController } from '../../../src/controllers/factory/createQueryController.js';
import { validateRequest } from '../../../src/validation/requests.js';
import { tenantFromCtx } from '../../../src/controllers/extractors/index.js';
import { ok, created, noContent } from '../../../src/http/responses.js';

// Mock dependencies
jest.mock('../../../src/validation/requests.js');
jest.mock('../../../src/controllers/extractors/index.js');
jest.mock('../../../src/http/responses.js');

const mockValidateRequest = validateRequest as jest.MockedFunction<typeof validateRequest>;
const mockTenantFromCtx = tenantFromCtx as jest.MockedFunction<typeof tenantFromCtx>;
const mockOk = ok as jest.MockedFunction<typeof ok>;
const mockCreated = created as jest.MockedFunction<typeof created>;
const mockNoContent = noContent as jest.MockedFunction<typeof noContent>;

describe('createQueryController', () => {
  let mockContainer: any;
  let mockDependencies: any;
  let mockAppService: any;
  let mockConfig: any;

  beforeEach(() => {
    mockContainer = { get: jest.fn() };
    mockDependencies = { dep1: 'value1' };
    mockAppService = {
      execute: jest.fn()};

    mockConfig = {
      pathSchema: { type: 'object' },
      querySchema: { type: 'object' },
      getContainer: jest.fn().mockReturnValue(mockContainer),
      createDependencies: jest.fn().mockReturnValue(mockDependencies),
      appServiceClass: jest.fn().mockReturnValue(mockAppService),
      extractParams: jest.fn().mockReturnValue({ param1: 'value1' }),
      transformResult: jest.fn(),
      responseType: 'ok' as const};

    mockValidateRequest.mockReturnValue({
      path: { id: '123' },
      query: { page: '1' },
      body: undefined});
    mockTenantFromCtx.mockReturnValue('tenant-123');
    mockOk.mockReturnValue({ statusCode: 200, body: '{"data":"result"}' });
    mockCreated.mockReturnValue({ statusCode: 201, body: '{"data":"result"}' });
    mockNoContent.mockReturnValue({ statusCode: 204, body: '' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a query controller with ok response type', async () => {
    mockAppService.execute.mockResolvedValue('test-result');
    mockConfig.transformResult.mockReturnValue('transformed-result');

    const controller = createQueryController(mockConfig);
    const result = await controller({} as any);

    expect(mockValidateRequest).toHaveBeenCalledWith({}, {
      path: mockConfig.pathSchema,
      query: mockConfig.querySchema});
    expect(mockTenantFromCtx).toHaveBeenCalledWith({});
    expect(mockConfig.getContainer).toHaveBeenCalled();
    expect(mockConfig.createDependencies).toHaveBeenCalledWith(mockContainer);
    expect(mockConfig.appServiceClass).toHaveBeenCalledWith(mockDependencies);
    expect(mockConfig.extractParams).toHaveBeenCalledWith(
      { id: '123' },
      { page: '1' }
    );
    expect(mockAppService.execute).toHaveBeenCalledWith({
      param1: 'value1'});
    expect(mockConfig.transformResult).toHaveBeenCalledWith('test-result');
    expect(mockOk).toHaveBeenCalledWith({ data: 'transformed-result' });
    expect(result).toEqual({ statusCode: 200, body: '{"data":"result"}' });
  });

  it('should create a query controller with created response type', async () => {
    mockConfig.responseType = 'created';
    mockAppService.execute.mockResolvedValue('test-result');
    mockConfig.transformResult.mockReturnValue('test-result');

    const controller = createQueryController(mockConfig);
    const result = await controller({} as any);

    expect(mockCreated).toHaveBeenCalledWith({ data: 'test-result' });
    expect(result).toEqual({ statusCode: 201, body: '{"data":"result"}' });
  });

  it('should create a query controller with noContent response type', async () => {
    mockConfig.responseType = 'noContent';
    mockAppService.execute.mockResolvedValue('test-result');

    const controller = createQueryController(mockConfig);
    const result = await controller({} as any);

    expect(mockNoContent).toHaveBeenCalled();
    expect(result).toEqual({ statusCode: 204, body: '' });
  });

  it('should create a query controller without path schema', async () => {
    delete mockConfig.pathSchema;
    mockAppService.execute.mockResolvedValue('test-result');

    const controller = createQueryController(mockConfig);
    await controller({} as any);

    expect(mockValidateRequest).toHaveBeenCalledWith({}, {
      query: mockConfig.querySchema});
  });

  it('should create a query controller without query schema', async () => {
    delete mockConfig.querySchema;
    mockAppService.execute.mockResolvedValue('test-result');

    const controller = createQueryController(mockConfig);
    await controller({} as any);

    expect(mockValidateRequest).toHaveBeenCalledWith({}, {
      path: mockConfig.pathSchema});
  });

  it('should create a query controller without transformResult', async () => {
    delete mockConfig.transformResult;
    mockAppService.execute.mockResolvedValue('test-result');

    const controller = createQueryController(mockConfig);
    await controller({} as any);

    expect(mockOk).toHaveBeenCalledWith({ data: 'test-result' });
  });

  it('should handle app service execution errors', async () => {
    const error = new Error('Service error');
    mockAppService.execute.mockRejectedValue(error);

    const controller = createQueryController(mockConfig);

    await expect(controller({} as any)).rejects.toThrow('Service error');
  });
});
