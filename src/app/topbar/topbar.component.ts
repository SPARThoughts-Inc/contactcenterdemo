import { Component } from '@angular/core';
import { StreamsApiService } from '../streams-api.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
  agentName: string = 'Admin';
  constructor(private streamsApiService: StreamsApiService) {}
  ngOnInit(): void {
    this.streamsApiService.getAgentName().subscribe((agentName) => {
      this.agentName = agentName;
    });
  }
}
