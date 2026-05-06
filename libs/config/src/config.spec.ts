import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Config } from './config';
import { configStore } from './core/store/config.store';
describe('Config', () => {
    let component: Config;
    let fixture: ComponentFixture<Config>;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Config],
            providers: [configStore],
        }).compileComponents();
        fixture = TestBed.createComponent(Config);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
