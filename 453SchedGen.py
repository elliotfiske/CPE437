import random, copy

class process:
   def __init__(self, name, arrival, burst, priority):
      self.name = name
      self.arrival = arrival
      self.initialBurst = burst
      self.burst = burst
      self.priority = priority
      self.wait = 0
      self.turnAround = 0
      self.terminated = False

class scheduler:
   def __init__(self, processes,algo="FCFS", quantum=0, preemptive=False, backup="FCFS"):
      self.algo = algo
      self.quantum=quantum
      self.preemptive=preemptive
      self.backup=backup
      self.processes = copy.deepcopy(processes)
      self.totalBurst = self.getTotalBurst(processes)
      self.gantt = []
      if algo == "SRJF":
         self.algo = "SJF"
         self.preemptive = True
      #print("\n] Short form:",self.printGantt(short=True),end="")
      """print("] algorithm = "+self.algo+", backup = "+self.backup,end="")
      if self.algo == "RR":
         print(", quantum = "+str(self.quantum))
      else:
         print(", preemptive = "+str(self.preemptive)) """
      self.schedule()
      self.printGantt()

   def printGantt(self):
      print("short form Gantt:"+"".join([process[-1] for process in self.gantt]))
      print("average wait:"+str(sum([p.wait for p in self.processes])*1.0/len(self.processes)))
      print("average turn around:"+str(sum([p.turnAround for p in self.processes])*1.0/len(self.processes)))
      print("\nELABORATION\n")
      print("".join(["["+process+"]" for process in self.gantt]))
      for T in range(len(self.gantt)):
          if T%4 == 0:
             print("T="+str(T),end="")
             if T < 10:
                print(" ",end="")
          else:
             print("    ",end="")
      print("\n")
      print("\tprocess\twait\tturn-around")
      for p in self.processes:
         print("\t"+p.name+"\t"+str(p.wait)+"T\t"+str(p.turnAround)+"T")

   def terminate(self,process): #process input must be an object of class "process"
      process.terminated = True
      terminationTime = max([p for p in enumerate(self.gantt) if p[1] == process.name],key=lambda x: x[0])[0]
      process.turnAround = terminationTime - process.arrival + 1
      process.wait = process.turnAround - process.initialBurst

   def getTotalBurst(self,processes):
      total=0
      for process in processes:
         total+=process.burst
      return total

   def order(self,processes,algorithm="FCFS"):
      if len(processes) == 1:
         return processes
      elif algorithm == "FCFS":
         return sorted(processes,key=lambda p:p.arrival)
      elif algorithm == "PRIO":
         return sorted(processes,key=lambda p:p.priority)
      elif algorithm == "SJF":
         return sorted(processes,key=lambda p:p.burst)
      elif algorithm == "ALPH":
         return sorted(processes,key=lambda p:str.lower(p.name))

   def schedule(self):
      procs = self.processes
      totalBurst = self.getTotalBurst(procs)
      T=0

      if self.algo in ["RR"]:
         RRQ = []
         qCount = copy.copy(self.quantum)
         while totalBurst > 0:
            RRQ.extend(self.order([p for p in procs if not p.terminated and p.arrival == T],self.backup))
            if len(RRQ) < 1:
               self.gantt.append("--")
            else:
               current = RRQ[0]
               self.gantt.append(current.name)
               totalBurst -= 1
               current.burst -= 1
               qCount -= 1
               if qCount == 0 or current.burst == 0:
                  qCount = copy.copy(self.quantum)
                  del RRQ[0]
                  if current.burst > 0:
                     RRQ.append(current)
                  else:
                     self.terminate(current)
            T+=1
#            print("DEBUG:: RRQ: ",[p.name for p in RRQ])
      if self.algo in ["FCFS","PRIO","SJF"]:
         while totalBurst > 0:
#            print("DEBUG:: total:",totalBurst," T:",T,end="\n")
            arrived = [p for p in procs if not p.terminated and p.arrival <= T]
            if len(arrived) > 0:
               if self.algo == "FCFS":
                  for p in self.order(arrived,self.backup):
                     self.gantt.extend([p.name for i in range(p.burst)])
                     T+=p.burst
                     totalBurst-=p.burst
                     #p.terminated = True
                     self.terminate(p)
               elif self.algo == "PRIO":
                  priorities = [p.priority for p in arrived]
                  highestPriority = min(priorities)
                  selected = [p for p in arrived if p.priority == highestPriority]
                  selectedProcess=self.order(selected,self.backup)[0]
                  if self.preemptive:
                     self.gantt.append(selectedProcess.name)
                     T+=1
                     selectedProcess.burst -= 1
                     totalBurst -= 1
                     if selectedProcess.burst == 0:
                        self.terminate(selectedProcess)
                        #selectedProcess.terminated = True
                  else:
                     self.gantt.extend([selectedProcess.name for i in range(selectedProcess.burst)])
                     T+=selectedProcess.burst
                     totalBurst-=selectedProcess.burst
                     #selectedProcess.terminated = True
                     self.terminate(selectedProcess)
               elif self.algo == "SJF":
                  shortestBurst = min([p.burst for p in arrived])
                  selected = [p for p in arrived if p.burst == shortestBurst]
                  #shortestOrder = self.order(arrived,"SJF")
                  selectedProcess=self.order(selected,self.backup)[0]
                  if self.preemptive:
                     self.gantt.append(selectedProcess.name)
                     T+=1
                     selectedProcess.burst -= 1
                     totalBurst -= 1
                     if selectedProcess.burst == 0:
                        #selectedProcess.terminated = True
                        self.terminate(selectedProcess)
                  else:
                     self.gantt.extend([selectedProcess.name for i in range(selectedProcess.burst)])
                     T+=selectedProcess.burst
                     totalBurst-=selectedProcess.burst
                     #selectedProcess.terminated = True
                     self.terminate(selectedProcess)
               elif self.algo == "RR":
                  if T == 0:                          #create the queue the first time
                     RRQ = []
                  print("DEBUG:: RRQ: ",[p.name for p in RRQ])
                  justArrived = [p for p in arrived if p.arrival == T]
                  for p in self.order(justArrived,"FCFS"):   #append all processes that have arrived just now
                     RRQ.append(p)
                  if len(RRQ) < 1:
                     self.gantt.append("--")
                     T+=1
                     continue
                  current = copy.deepcopy(RRQ[0])
                  RRQ.remove(RRQ[0])
                  for q in range(self.quantum):
                      self.gantt.append(current.name)
                      T+=1
                      current.burst -= 1
                      totalBurst -= 1
                      if current.burst == 0:
                         self.terminate(current)
                         #current.terminated = True

                  if current.terminated:
                      RRQ.append(current)
            else:
                  self.gantt.append("--")
                  T+=1


if __name__ == '__main__':
   numProcesses = 5
   ganttRange = (6,10)
   burstRange = (1,ganttRange[1] - numProcesses + 1)
   priorityRange = (2,numProcesses) #will be multiplied by 10 for more realistic values
   quantumRange = (1,4)
   processes = []

   algoNames = {"PRIO":"Priority","FCFS":"First-come-first-serve",
                "SJF":"Shortest-job-first","SRJF":"Shortest-remaining-job-first",
                "RR":"Round-robin","ALPH":"Alpha-numeric ordering (based on the name of the process)"}

   # for p in range(numProcesses):
   #    processes.append(process("P"+str(p),random.randint(0,ganttRange[0]),random.randint(burstRange[0],burstRange[1]),random.randint(priorityRange[0],priorityRange[1])*10))
   processes = [process("P0", 0, 5, 50), process("P1", 0, 5, 20), process("P2", 1, 1, 40), process("P3", 4, 4, 20), process("P4", 0, 6, 40)]

   print("\n\nSCHEDULING PROBLEM\n\nUse the following process table as reference for scheduling questions. Note that T stands for a generic time unit and that lower quanta means higher priority.\n")
   print("\tProcess\tarrival\tburst\tpriority",end="\n")

   for p in processes:
      print("\t"+p.name+"\t"+"T="+str(p.arrival)+"\t"+str(p.burst)+"T\t"+str(p.priority),end="\n")
   print()
   algoChoice = random.choice(["PRIO","SJF","SRJF","RR","FCFS","RR","RR","PRIO","RR"])

   preemptiveOption = random.choice([True,False])
   quantumOption = random.randint(quantumRange[0],quantumRange[1])
   backupOption = "FCFS"

   promptText = "Please draw the Gantt chart for the above processes on a single CPU. "
   promptText += "Enter the process numbers in a string starting from T=0 where every character takes one T time unit. Use the dash \"-\" if no processes are scheduled for that time slot. "
   promptText +="For example [ 00-111 ] means process 0 (P0) is scheduled from T=0 to T=1, and P1 is scheduled for T=3 to T=5. At T=2 no process is schedued. \n\n"
   promptText += "Use "

   if algoChoice in ["PRIO"] and preemptiveOption:
      promptText += "PREEMPTIVE "
   elif algoChoice in ["SJF","SRJF"]:
      backupOption = random.choice(["FCFS","PRIO"])
   elif algoChoice in ["FCFS"]:
      backupOption = random.choice(["ALPH","PRIO"])

   promptText += algoNames[algoChoice].upper()
   if algoChoice in ["RR"]:
      promptText += " with quantum of "+str(quantumOption)

   promptText += " as your primary scheduling algorithm. "
   promptText += "Break any ties using the "+algoNames[backupOption]+" backup scheduler and if there are still ties, use lexicographic ordering based on process id. Also find the average wait time and the average turn-around time for the set of processes."

   print(promptText)
   print("\nSOLUTION\n")

   if algoChoice == "SRJF":
      scheduler(processes,"SJF",preemptive=True,backup=backupOption)
   else:
      scheduler(processes,algoChoice,preemptive=preemptiveOption,backup=backupOption,quantum=quantumOption)
"""
   S = scheduler(processes,"RR",quantum=2)
   S = scheduler(processes,"RR",quantum=3)
   S = scheduler(processes,"RR",quantum=4)
   S = scheduler(processes,"PRIO")
   S = scheduler(processes,"PRIO",preemptive=True)
   S = scheduler(processes,"SJF")
   S = scheduler(processes,"SJF",preemptive=True) """
