import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Terminal} from 'xterm';
import {Cluster} from '@shared/entity/cluster';

@Component({
  selector: 'km-web-terminal',
  templateUrl: './template.html',
  styleUrls: [],
})
export class WebTerminalComponent implements OnInit {
  terminal: Terminal;
  projectId: string;
  clusterId: string;

  @Input() cluster: Cluster;
  @Output() openInNewTab = new EventEmitter<boolean>();
  @Output() closeTerminal = new EventEmitter<boolean>();

  constructor() {}

  ngOnInit(): void {
  }

  onCloseTerminal($event: boolean) {
    this.closeTerminal.emit($event);
  }

  onOpenInNewTab($event: boolean) {
    this.openInNewTab.emit($event);
  }
}
