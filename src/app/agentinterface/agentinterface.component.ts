import { Component , AfterViewInit} from '@angular/core';
import { StreamsApiService } from '../streams-api.service';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

export interface Agent {
  id: string;
  name: string;
  status: string;
}

@Component({
  selector: 'app-agentinterface',
  standalone: true,
  imports: [NgIf, NgFor , FormsModule],
  templateUrl: './agentinterface.component.html',
  styleUrl: './agentinterface.component.scss'
})
export class AgentinterfaceComponent {
  canMergeCall: boolean = false;
  connectedCalls: { number: string, status: string }[] = [];

  contactAttributes: any = {};
  haveContactAttributes = false;
  callState: string = '';
  selectedCountryCode: string = '+1';
  incomingCall = false;
  objectKeys = Object.keys;
  isHold = false;
  isMute = false;
  callerNumber!: string;
  currentDialString: string = '';
  constructor(private streamsApiService: StreamsApiService) { }
  private callStateSubscription: Subscription = new Subscription();
  agentName!: string;
  availableAgents: any[] = [];
  isOnCall: boolean = false; 
  quickConnects: any[] = [];

  ngOnInit(): void {
    this.callStateSubscription = this.streamsApiService
      .getCallState()
      .subscribe((state: string) => {
        this.callState = state;
      });
    this.streamsApiService.getIncomingCall().subscribe((callInfo) => {
      if (callInfo) {
        this.incomingCall = callInfo.incomingCall;
        this.callerNumber = callInfo.callerNumber;
      } else {
        this.incomingCall = false;
        this.callerNumber = '';
      }
    });
    this.streamsApiService.getAgentName().subscribe((agentName) => {
      this.agentName = agentName;
    });
    this.streamsApiService.getAvailableAgents().subscribe({
      next: (agents) => {
        console.log('Available Agents:', agents);
        this.availableAgents = agents;
      },
      error: (err) => {
        console.error('Failed to fetch available agents:', err);
      }
    });
    this.checkActiveCalls();
    this.updateCanMergeCall(); 

  }
  checkActiveCalls(): void {
    connect.agent((agent) => {
      const agentContacts = agent.getContacts(connect.ContactType.VOICE);
      console.log('Retrieved contacts:', agentContacts);
  
      const activeContacts = agentContacts.filter(contact => {
        const status = contact.getStatus();
        console.log('Contact Status:', status);
        return status.type === 'connected';
      });
  
      console.log('Filtered active contacts:', activeContacts);
      console.log('Number of active contacts:', activeContacts.length);
  
      this.canMergeCall = activeContacts.length >= 2;
      console.log('Can merge call:', this.canMergeCall);
    });
  }
  
  
  
  ngAfterViewInit() {
    const containerDiv = document.getElementById('ccpContainer');
    if (containerDiv) {
      this.streamsApiService.initCCP(containerDiv);
      this.handleIncomingContacts();
    } else {
      console.error('CCP container not found');
    }
  }
  
  handleIncomingContacts() {
    connect.contact((contact) => {
      contact.onAccepted(async () => {
        try {
          const attributes = await contact.getAttributes();
          this.contactAttributes = attributes;
          this.haveContactAttributes = true;
        } catch (error) {
          console.error('Failed to fetch contact attributes:', error);
          this.haveContactAttributes = false;
        }
      });
    });
  }
  answerCall() {
    this.streamsApiService.answerCall();
  }
  holdCall() {
    if (!this.isHold) {
      this.streamsApiService.holdCall();
      this.isHold = true;
    } else {
      this.streamsApiService.resumeCall();
      this.isHold = false;
    }
  }
  rejectCall() {
    this.streamsApiService.rejectCall();
  }
  endCall() {
    this.streamsApiService.endCall();
  }
  closeCall() {
    this.streamsApiService.closeCall();
    this.callState = '';
  }
  muteCall() {
    if (!this.isMute) {
      this.streamsApiService.muteCall();
      this.isMute = true;
    } else {
      this.streamsApiService.unmuteCall();
      this.isMute = false;
    }
  }
  unmuteCall() {
    this.streamsApiService.unmuteCall();
  }
  dial(digit: string) {
    this.currentDialString += digit;
  }


makeCall(): void {
  const countryCode = '+1'; 

  if (!this.currentDialString) {
    console.error('Dial string cannot be empty.');
    return;
  }

  let dialString = this.currentDialString.trim();

  if (!dialString.startsWith('+')) {
    dialString = countryCode + dialString;
  }

  const phoneRegex = /^\+\d{1,15}$/;

  console.log('Attempting to make call with dial string:', dialString);

  if (phoneRegex.test(dialString)) {
    connect.agent((agent) => {
      const agentContacts = agent.getContacts(connect.ContactType.VOICE);
      const activeContact = agentContacts.find(contact => contact.getStatus().type === 'connected');

      if (activeContact) {
        console.log('Agent is already on a call. Adding a second call (conference).');
        const endpoint = connect.Endpoint.byPhoneNumber(dialString);
        activeContact.addConnection(endpoint, {
          success: () => {
            console.log(`Successfully added ${dialString} as a second call.`);
            this.updateCallStatus('on hold'); 
            this.addNewCall(dialString, 'connected'); 
          },
          failure: (error) => console.error('Failed to add the call as a conference', error),
        });
      } else {
        const endpoint = connect.Endpoint.byPhoneNumber(dialString);
        agent.connect(endpoint, {
          success: () => {
            console.log(`Successfully placed an outbound call to ${dialString}`);
            this.addNewCall(dialString, 'connected'); 
          },
          failure: (error) => console.error('Failed to place an outbound call', error),
        });
      }
    });
  } else {
    console.error('Phone number is not in the correct E.164 format:', dialString);
  }
}

addNewCall(number: string, status: string): void {
  this.connectedCalls.push({ number, status });
  console.log('Updated call list:', this.connectedCalls);
}

updateCallStatus(status: string): void {
  this.connectedCalls.forEach(call => {
    if (call.status === 'connected') {
      call.status = status;
    }
  });
  console.log('Updated call statuses:', this.connectedCalls);
}

mergeCall(): void {
  connect.agent((agent) => {
      const agentContacts = agent.getContacts(connect.ContactType.VOICE);

      const connectedContact = agentContacts.find(contact => {
          const status = contact.getStatus();
          console.log('Connected Contact Status:', status);
          return status.type === connect.ContactStateType.CONNECTED;
      });

      const onHoldContact = agentContacts.find(contact => {
          const connections = contact.getConnections();
          const isOnHold = connections.some(connection => {
              const state = connection.getState();
              console.log('Connection State:', state);
              return state.type === connect.ConnectionStateType.HOLD;
          });
          return isOnHold;
      });

      if (connectedContact && onHoldContact) {
          console.log('Attempting to merge the connected and on-hold calls.');

          connectedContact.conferenceConnections({
              success: () => {
                  console.log('Successfully merged the connected and on-hold calls into a conference.');

                  this.connectedCalls.forEach(call => {
                      if (call.status === 'connected' || call.status === 'on hold') {
                          call.status = 'joined';
                      }
                  });
                  console.log('Updated call statuses to "joined":', this.connectedCalls);
              },
              failure: (error) => {
                  console.error('Failed to merge the calls into a conference', error);
              }
          });
      } else {
          console.error('Could not find both connected and on-hold calls to merge.');
      }
  });
}

  
  
  updateCanMergeCall(): void {
    connect.agent((agent) => {
      const agentContacts = agent.getContacts(connect.ContactType.VOICE);
      const activeContacts = agentContacts.filter(contact => contact.getStatus().type === 'connected');
  
      console.log('Contacts after attempting to merge:', agentContacts);
      console.log('Active contacts after attempting to merge:', activeContacts);
  
      this.canMergeCall = activeContacts.length >= 2;
      console.log('canMergeCall after merge attempt:', this.canMergeCall);
    });
  }
  
  
  
  onDialStringChange(newDialString: string): void {
    console.log('Dial string updated:', newDialString);
    this.currentDialString = newDialString;
  }
  
  clear() {
    this.currentDialString = '';
  }

 
}