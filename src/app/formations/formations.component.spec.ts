// Jasmine imports are global
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormationsComponent } from './formations.component';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { DragDropModule } from '@angular/cdk/drag-drop';

describe('FormationsComponent', () => {
  let component: FormationsComponent;
  let fixture: ComponentFixture<FormationsComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormationsComponent,
        HttpClientTestingModule,
        ReactiveFormsModule,
        NgSelectModule,
        DragDropModule
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(FormationsComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.showModal).toBe(false);
    expect(component.guilds).toEqual([]);
    expect(component.formationList).toEqual([]);
    expect(component.filteredFormations).toEqual([]);
    expect(component.loading).toBe(false);
    expect(component.searchTerm).toBe('');
    expect(component.showEditModal).toBe(false);
    expect(component.editingFormation).toBeNull();
    expect(component.channels).toEqual([]);
    expect(component.forumThreads).toEqual({});
    expect(component.newThreadName).toEqual({});
    expect(component.page).toBe(1);
    expect(component.limit).toBe(5);
    expect(component.totalFormations).toBe(0);
  });

  it('should open and close add modal', () => {
    expect(component.showModal).toBe(false);
    component.openModal();
    expect(component.showModal).toBe(true);
    component.closeModal();
    expect(component.showModal).toBe(false);
  });

  it('should reset form and threads when closing modal', () => {
    component.formationForm.patchValue({ name: 'Test', uuidGuild: 'guild1' });
    component.forumThreads = { forum1: ['Thread 1'] };
    component.newThreadName = { forum1: 'New Thread' };

    component.closeModal();

    expect(component.formationForm.get('name')?.value).toBe('');
    expect(component.forumThreads).toEqual({});
    expect(component.newThreadName).toEqual({});
  });

  it('should calculate total pages correctly', () => {
    component.totalFormations = 12;
    component.limit = 5;
    expect(component.getTotalPages()).toBe(3);

    component.totalFormations = 5;
    expect(component.getTotalPages()).toBe(1);

    component.totalFormations = 0;
    expect(component.getTotalPages()).toBe(1);
  });

  it('should load guilds successfully', () => {
    const mockGuilds = [
      { uuid: 'guild1', name: 'Guild 1' },
      { uuid: 'guild2', name: 'Guild 2' }
    ];

    component.loadGuilds();

    const req = httpMock.expectOne('/api/guilds');
    expect(req.request.method).toBe('GET');
    req.flush(mockGuilds);

    expect(component.guilds).toEqual(mockGuilds);
    expect(component.loadingGuilds).toBe(false);
  });

  it('should handle guilds loading with nested data structure', () => {
    const mockResponse = {
      data: [
        { uuid: 'guild1', name: 'Guild 1' },
        { uuid: 'guild2', name: 'Guild 2' }
      ]
    };

    component.loadGuilds();

    const req = httpMock.expectOne('/api/guilds');
    req.flush(mockResponse);

    expect(component.guilds).toEqual(mockResponse.data);
  });

  it('should handle guilds loading error', () => {
    component.loadGuilds();

    const req = httpMock.expectOne('/api/guilds');
    req.error(new ErrorEvent('Network error'));

    expect(component.guilds).toEqual([]);
    expect(component.loadingGuilds).toBe(false);
  });

  it('should load formations successfully', () => {
    const mockResponse = {
      data: {
        data: [
          { id: 1, name: 'Formation 1', uuidGuild: 'guild1' },
          { id: 2, name: 'Formation 2', uuidGuild: 'guild2' }
        ],
        total: 2
      }
    };

    component.loadFormations(1);

    const req = httpMock.expectOne('/api/formations?page=1&limit=5');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);

    expect(component.formationList).toEqual(mockResponse.data.data);
    expect(component.totalFormations).toBe(2);
    expect(component.page).toBe(1);
    expect(component.loading).toBe(false);
  });

  it('should load formations with search term', () => {
    component.searchTerm = 'test';
    component.loadFormations(1, 'test');

    const req = httpMock.expectOne('/api/formations?page=1&limit=5&search=test');
    expect(req.request.method).toBe('GET');
    req.flush({ data: { data: [], total: 0 } });
  });

  it('should handle formations loading with different data structures', () => {
    // Test with simple array
    component.loadFormations(1);
    const req1 = httpMock.expectOne('/api/formations?page=1&limit=5');
    req1.flush([
      { id: 1, name: 'Formation 1' },
      { id: 2, name: 'Formation 2' }
    ]);

    expect(component.formationList.length).toBe(2);
    expect(component.totalFormations).toBe(2);

    // Test with nested data
    component.loadFormations(2);
    const req2 = httpMock.expectOne('/api/formations?page=2&limit=5');
    req2.flush({
      data: [
        { id: 3, name: 'Formation 3' },
        { id: 4, name: 'Formation 4' }
      ],
      total: 4
    });

    expect(component.formationList.length).toBe(2);
    expect(component.totalFormations).toBe(4);
  });

  it('should handle formations loading error', () => {
    component.loadFormations(1);

    const req = httpMock.expectOne('/api/formations?page=1&limit=5');
    req.error(new ErrorEvent('Network error'));

    expect(component.formationList).toEqual([]);
    expect(component.filteredFormations).toEqual([]);
    expect(component.loading).toBe(false);
  });

  it('should load channels successfully', () => {
    const mockChannels = [
      { uuid: 'channel1', name: 'Channel 1', type: 'text', uuidCategory: 'cat1', categoryName: 'Category 1' },
      { uuid: 'channel2', name: 'Channel 2', type: 'forum', uuidCategory: 'cat2' }
    ];

    component.loadChannels();

    const req = httpMock.expectOne('/api/channels');
    expect(req.request.method).toBe('GET');
    req.flush(mockChannels);

    expect(component.channels.length).toBe(2);
    expect(component.channels[0].categoryName).toBe('Category 1');
    expect(component.channels[1].categoryName).toBe('Sans catégorie');
  });

  it('should handle channels loading with nested data structure', () => {
    const mockResponse = {
      data: {
        data: [
          { uuid: 'channel1', name: 'Channel 1', type: 'text' }
        ]
      }
    };

    component.loadChannels();

    const req = httpMock.expectOne('/api/channels');
    req.flush(mockResponse);

    expect(component.channels.length).toBe(1);
  });

  it('should get guild name correctly', () => {
    component.guilds = [
      { uuid: 'guild1', name: 'Guild 1' },
      { uuid: 'guild2', name: 'Guild 2' }
    ];

    expect(component.getGuildName('guild1')).toBe('Guild 1');
    expect(component.getGuildName('guild2')).toBe('Guild 2');
    expect(component.getGuildName('unknown')).toBe('unknown');
  });

  it('should refresh formations', () => {
    spyOn(component, 'loadFormations');
    component.refreshFormations();

    expect(component.loadFormations).toHaveBeenCalledWith(1);
  });

  it('should filter formations correctly', () => {
    component.formationList = [
      { name: 'Formation 1', uuidGuild: 'guild1' },
      { name: 'Formation 2', uuidGuild: 'guild2' },
      { name: 'Test Formation', uuidGuild: 'guild3' }
    ];

    component.guilds = [
      { uuid: 'guild1', name: 'Guild 1' },
      { uuid: 'guild2', name: 'Guild 2' },
      { uuid: 'guild3', name: 'Test Guild' }
    ];

    component.searchTerm = 'test';
    component.filterFormations();

    expect(component.filteredFormations).toEqual([
      { name: 'Test Formation', uuidGuild: 'guild3' }
    ]);
  });

  it('should show all formations when no search term', () => {
    component.formationList = [
      { name: 'Formation 1', uuidGuild: 'guild1' },
      { name: 'Formation 2', uuidGuild: 'guild2' }
    ];

    component.searchTerm = '';
    component.filterFormations();

    expect(component.filteredFormations).toEqual(component.formationList);
  });

  it('should handle search input', () => {
    spyOn(component, 'loadFormations');
    const event = { target: { value: 'test search' } } as any;

    component.onSearch(event);

    expect(component.searchTerm).toBe('test search');
    expect(component.loadFormations).toHaveBeenCalledWith(1, 'test search');
  });

  it('should get selected forum channels', () => {
    component.channels = [
      { uuid: 'channel1', name: 'Channel 1', type: 'text' },
      { uuid: 'channel2', name: 'Channel 2', type: 'forum' },
      { uuid: 'channel3', name: 'Channel 3', type: 'forum' }
    ];

    component.formationForm.patchValue({ channelIds: ['channel2', 'channel3'] });

    const selectedForums = component.selectedForumChannels;
    expect(selectedForums.length).toBe(2);
    expect(selectedForums[0].type).toBe('forum');
    expect(selectedForums[1].type).toBe('forum');
  });

  it('should add thread to forum', () => {
    const forumId = 'forum1';
    component.newThreadName[forumId] = 'New Thread';
    component.addThread(forumId);

    expect(component.forumThreads[forumId]).toContain('New Thread');
    expect(component.newThreadName[forumId]).toBe('');
  });

  it('should not add empty thread', () => {
    const forumId = 'forum1';
    component.newThreadName[forumId] = '';
    component.addThread(forumId);

    expect(component.forumThreads[forumId]).toBeUndefined();
  });

  it('should not add whitespace-only thread', () => {
    const forumId = 'forum1';
    component.newThreadName[forumId] = '   ';
    component.addThread(forumId);

    expect(component.forumThreads[forumId]).toBeUndefined();
  });

  it('should remove thread from forum', () => {
    const forumId = 'forum1';
    component.forumThreads[forumId] = ['Thread 1', 'Thread 2', 'Thread 3'];
    component.removeThread(forumId, 1);

    expect(component.forumThreads[forumId]).toEqual(['Thread 1', 'Thread 3']);
  });

  it('should update threads in form', () => {
    component.forumThreads = {
      forum1: ['Thread 1', 'Thread 2'],
      forum2: ['Thread 3']
    };

    component.updateThreadsInForm();

    const threads = component.formationForm.get('threads')?.value;
    expect(threads).toEqual([
      { name: 'Thread 1', forumId: 'forum1' },
      { name: 'Thread 2', forumId: 'forum1' },
      { name: 'Thread 3', forumId: 'forum2' }
    ]);
  });

  it('should remove duplicate threads', () => {
    component.forumThreads = {
      forum1: ['Thread 1', 'Thread 1', 'Thread 2']
    };

    component.updateThreadsInForm();

    const threads = component.formationForm.get('threads')?.value;
    expect(threads).toEqual([
      { name: 'Thread 1', forumId: 'forum1' },
      { name: 'Thread 2', forumId: 'forum1' }
    ]);
  });

  it('should submit formation successfully', () => {
    const mockFormData = {
      name: 'Test Formation',
      uuidGuild: 'guild1',
      channelIds: ['channel1', 'channel2'],
      threads: [{ name: 'Thread 1', forumId: 'forum1' }]
    };

    component.formationForm.patchValue(mockFormData);
    component.submitting = false;

    component.submitFormation();

    expect(component.submitting).toBe(true);

    const req = httpMock.expectOne('/api/formations');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.name).toBe('Test Formation');
    req.flush({ success: true });

    expect(component.submitting).toBe(false);
    expect(component.showModal).toBe(false);
  });

  it('should not submit invalid formation', () => {
    component.formationForm.patchValue({ name: '', uuidGuild: '' });
    component.formationForm.markAsTouched();
    component.formationForm.updateValueAndValidity();

    component.submitFormation();

    expect(component.submitting).toBe(false);
  });

  it('should delete formation successfully', () => {
    const mockFormation = { id: 1, name: 'Test Formation' };
    spyOn(component, 'refreshFormations');

    component.deleteFormation(mockFormation);

    const req = httpMock.expectOne('/api/formations/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });

    expect(component.refreshFormations).toHaveBeenCalled();
  });

  it('should open edit modal', () => {
    const mockFormation = { id: 1, name: 'Test Formation', channelIds: ['channel1'] };
    component.openEditModal(mockFormation);

    expect(component.showEditModal).toBe(true);
    expect(component.editingFormation).toEqual(mockFormation);
    expect(component.editFormationForm.get('name')?.value).toBe('Test Formation');
    expect(component.editFormationForm.get('channelIds')?.value).toEqual(['channel1']);
  });

  it('should close edit modal', () => {
    component.showEditModal = true;
    component.closeEditModal();

    expect(component.showEditModal).toBe(false);
    expect(component.editingFormation).toBeNull();
  });

  it('should submit edit formation successfully', () => {
    const mockFormation = { id: 1, name: 'Test Formation' };
    const mockFormData = {
      name: 'Updated Formation',
      channelIds: ['channel1', 'channel2']
    };

    component.editingFormation = mockFormation;
    component.editFormationForm.patchValue(mockFormData);
    component.submitting = false;

    component.submitEditFormation();

    expect(component.submitting).toBe(true);

    const req = httpMock.expectOne('/api/formations/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.name).toBe('Updated Formation');
    req.flush({ success: true });

    expect(component.submitting).toBe(false);
    expect(component.showEditModal).toBe(false);
  });

  it('should get threads for forum', () => {
    const mockFormation = {
      threads: [
        { name: 'Thread 1', forumId: 'forum1' },
        { name: 'Thread 2', forumId: 'forum1' },
        { name: 'Thread 3', forumId: 'forum2' }
      ]
    };

    const threads = component.getThreadsForForum(mockFormation, 'forum1');
    expect(threads).toEqual([
      { name: 'Thread 1', forumId: 'forum1' },
      { name: 'Thread 2', forumId: 'forum1' }
    ]);
  });

  it('should handle drag and drop for channels', () => {
    const mockFormation = {
      channels: [
        { id: 1, name: 'Channel 1' },
        { id: 2, name: 'Channel 2' }
      ]
    };

    const mockEvent = {
      previousIndex: 0,
      currentIndex: 1,
      container: { data: mockFormation.channels }
    } as any;

    spyOn(component, 'saveChannelsOrder');
    component.reorderChannels(mockFormation, mockEvent);

    expect(mockFormation.channels[0].name).toBe('Channel 2');
    expect(mockFormation.channels[1].name).toBe('Channel 1');
    expect(component.saveChannelsOrder).toHaveBeenCalledWith(mockFormation);
  });

  it('should save channels order successfully', () => {
    const mockFormation = { id: 1, channels: [{ id: 1 }, { id: 2 }] };
    component.saveChannelsOrder(mockFormation);

    const req = httpMock.expectOne('/api/formations/1/channels-order');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ channelIds: [1, 2] });
    req.flush({ success: true });
  });

  it('should handle drag and drop for threads', () => {
    const mockFormation = {
      threads: [
        { name: 'Thread 1', forumId: 'forum1' },
        { name: 'Thread 2', forumId: 'forum1' }
      ]
    };

    const mockEvent = {
      previousIndex: 0,
      currentIndex: 1,
      container: { data: mockFormation.threads }
    } as any;

    spyOn(component, 'saveThreadsOrder');
    component.reorderThreads(mockFormation, 'forum1', mockEvent);

    expect(mockFormation.threads[0].name).toBe('Thread 2');
    expect(mockFormation.threads[1].name).toBe('Thread 1');
    expect(component.saveThreadsOrder).toHaveBeenCalledWith(mockFormation, 'forum1');
  });

  it('should save threads order successfully', () => {
    const mockFormation = { id: 1 };
    const forumId = 'forum1';
    component.saveThreadsOrder(mockFormation, forumId);

    const req = httpMock.expectOne('/api/formations/1/threads-order');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ forumId, threadNames: [] });
    req.flush({ success: true });
  });

  it('should get sorted channels', () => {
    const mockFormation = {
      channels: [
        { id: 1, name: 'Channel 1', order: 2 },
        { id: 2, name: 'Channel 2', order: 1 }
      ]
    };

    const sortedChannels = component.getSortedChannels(mockFormation);
    expect(sortedChannels[0].order).toBe(1);
    expect(sortedChannels[1].order).toBe(2);
  });

  it('should get category name', () => {
    component.channels = [
      { uuid: 'channel1', categoryName: 'Category 1' },
      { uuid: 'channel2', categoryName: 'Category 2' }
    ];

    expect(component.getCategoryName('channel1')).toBe('Category 1');
    expect(component.getCategoryName('unknown')).toBe('Sans catégorie');
  });

  it('should handle channel toggle', () => {
    const uuid = 'channel1';
    const event = { target: { checked: true } } as any;
    component.formationForm.patchValue({ channelIds: [] });

    component.onChannelToggle(uuid, event);

    expect(component.formationForm.get('channelIds')?.value).toContain(uuid);

    event.target.checked = false;
    component.onChannelToggle(uuid, event);

    expect(component.formationForm.get('channelIds')?.value).not.toContain(uuid);
  });
}); 