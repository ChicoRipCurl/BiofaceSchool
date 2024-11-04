import { Component } from '@angular/core';
import {RouterOutlet} from "@angular/router";
import {AppComponent} from "../../app.component";

@Component({
  selector: 'app-home-screen',
  standalone: true,
  imports: [
    RouterOutlet,
    AppComponent
  ],
  templateUrl: './home-screen.component.html',
  styleUrl: './home-screen.component.css'
})
export class HomeScreenComponent {

}
