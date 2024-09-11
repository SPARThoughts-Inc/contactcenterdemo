import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AgentinterfaceComponent } from "./agentinterface/agentinterface.component";
import { TopbarComponent } from "./topbar/topbar.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AgentinterfaceComponent, TopbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'contact-center-vajida';
}
