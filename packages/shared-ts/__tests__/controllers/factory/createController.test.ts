import { createController } from '../../../src/controllers/factory/createController.js';
import { validateRequest } from '../../../src/validation/requests.js';
import { tenantFromCtx, actorFromCtx } from '../../../src/controllers/extractors/index.js';
import { ok, created, noContent } from '../../../src/http/responses.js';

// Mock dependencies
jest.mock('../../../src/validation/requests.js');
jest.mock('../../../src/controllers/extractors/index.js');
jest.mock('../../../src/http/responses.js');

const mockValidateRequest = validateRequest as jest.MockedFunction<typeof validateRequest>;
const mockTenantFromCtx = tenantFromCtx as jest.MockedFunction<typeof tenantFromCtx>;
const mockActorFromCtx = actorFromCtx as jest.MockedFunction<typeof actorFromCtx>;
const mockOk = ok as jest.MockedFunction<typeof ok>;
const mockCreated = created as jest.MockedFunction<typeof created>;
const mockNoContent = noContent as jest.MockedFunction<typeof noContent>;

describe('createController', () => {
  let mockContainer: any;
  let mockDependencies: any;
  let mockAppService: any;
  let mockConfig: any;

  beforeEach(() => {
    mockContainer = { get: jest.fn() };
    mockDependencies = { dep1: 'value1' };
    mockAppService = {
      execute: jest.fn(),
    };

    mockConfig = {
      pathSchema: { type: 'object' },
      bodySchema: { type: 'object' },
      includeActor: true,
      getContainer: jest.fn().mockReturnValue(mockContainer),
      createDependencies: jest.fn().mockReturnValue(mockDependencies),
      appServiceClass: jest.fn().mockReturnValue(mockAppService),
      extractParams: jest.fn().mockReturnValue({ param1: 'value1' }),
      transformResult: jest.fn(),
      responseType: 'ok' as const,
    };

    mockValidateRequest.mockReturnValue({
      path: { id: '123' },
      query: {},
      body: { name: 'test' },
    });
    mockTenantFromCtx.mockReturnValue('tenant-123');
    mockActorFromCtx.mockReturnValue({ userId: 'user-123' });
    mockOk.mockReturnValue({ statusCode: 200, body: '{"data":"result"}' });
    mockCreated.mockReturnValue({ statusCode: 201, body: '{"data":"result"}' });
    mockNoContent.mockReturnValue({ statusCode: 204, body: '' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a controller with ok response type', async () => {
    mockAppService.execute.mockResolvedValue('test-result');
    mockConfig.transformResult.mockReturnValue('transformed-result');

    const controller = createController(mockConfig);
    const result = await controller({} as any);

    expect(mockValidateRequest).toHaveBeenCalledWith({}, {
      path: mockConfig.pathSchema,
      body: mockConfig.bodySchema,
    });
    expect(mockTenantFromCtx).toHaveBeenCalledWith({});
    expect(mockActorFromCtx).toHaveBeenCalledWith({});
    expect(mockConfig.getContainer).toHaveBeenCalled();
    expect(mockConfig.createDependencies).toHaveBeenCalledWith(mockContainer);
    expect(mockConfig.appServiceClass).toHaveBeenCalledWith(mockDependencies);
    expect(mockConfig.extractParams).toHaveBeenCalledWith(
      { id: '123' },
      { name: 'test' }
    );
    expect(mockAppService.execute).toHaveBeenCalledWith({
      tenantId: 'tenant-123',
      actor: { userId: 'user-123' },
      param1: 'value1',
    });
    expect(mockConfig.transformResult).toHaveBeenCalledWith('test-result');
    expect(mockOk).toHaveBeenCalledWith({ data: 'transformed-result' });
    expect(result).toEqual({ statusCode: 200, body: '{"data":"result"}' });
  });

  it('should create a controller with created response type', async () => {
    mockConfig.responseType = 'created';
    mockAppService.execute.mockResolvedValue('test-result');
    mockConfig.transformResult.mockReturnValue('test-result');

    const controller = createController(mockConfig);
    const result = await controller({} as any);

    expect(mockCreated).toHaveBeenCalledWith({ data: 'test-result' });
    expect(result).toEqual({ statusCode: 201, body: '{"data":"result"}' });
  });

  it('should create a controller with noContent response type', async () => {
    mockConfig.responseType = 'noContent';
    mockAppService.execute.mockResolvedValue('test-result');

    const controller = createController(mockConfig);
    const result = await controller({} as any);

    expect(mockNoContent).toHaveBeenCalled();
    expect(result).toEqual({ statusCode: 204, body: '' });
  });

  it('should create a controller without actor when includeActor is false', async () => {
    mockConfig.includeActor = false;
    mockAppService.execute.mockResolvedValue('test-result');

    const controller = createController(mockConfig);
    await controller({} as any);

    expect(mockActorFromCtx).not.toHaveBeenCalled();
    expect(mockAppService.execute).toHaveBeenCalledWith({
      tenantId: 'tenant-123',
      actor: undefined,
      param1: 'value1',
    });
  });

  it('should create a controller without path schema', async () => {
    delete mockConfig.pathSchema;
    mockAppService.execute.mockResolvedValue('test-result');

    const controller = createController(mockConfig);
    await controller({} as any);

    expect(mockValidateRequest).toHaveBeenCalledWith({}, {
      body: mockConfig.bodySchema,
    });
  });

  it('should create a controller without body schema', async () => {
    delete mockConfig.bodySchema;
    mockAppService.execute.mockResolvedValue('test-result');

    const controller = createController(mockConfig);
    await controller({} as any);

    expect(mockValidateRequest).toHaveBeenCalledWith({}, {
      path: mockConfig.pathSchema,
    });
  });

  it('should create a controller without transformResult', async () => {
    delete mockConfig.transformResult;
    mockAppService.execute.mockResolvedValue('test-result');

    const controller = createController(mockConfig);
    await controller({} as any);

    expect(mockOk).toHaveBeenCalledWith({ data: 'test-result' });
  });

  it('should handle app service execution errors', async () => {
    const error = new Error('Service error');
    mockAppService.execute.mockRejectedValue(error);

    const controller = createController(mockConfig);

    await expect(controller({} as any)).rejects.toThrow('Service error');
  });
});
