with_draw = 0
deposit =0
balance = 1000
attempts = 0
max_attempts = 3
pin = "1234"  # Changed to a string to match input()

names = [
    "mohamed",
    "ali",
    "mazen",
    "mostafa",
    "ahmed",
    "kareem",
    "abdullah",
    "salah",
    "salem",
    "mahummoud",
]

while True:
  name = input("Enter your first name or (press q to quit):\n").lower()

  if name in names and name.isalpha():
    pin_code = input("Enter the pin code:\n")

    if pin_code == pin and pin_code.isdigit():
      print("You have logged in successfully.")
      print(f"in your bank is: {balance}")
      payment = input("what the payment will be with_draw or deposit:\n")
      if payment == "with_draw":
          with_draw = float(input("How much you want to with draw money from the bank:\n"))
          if with_draw > 1000 or with_draw < 0:
              print("Pleae choose from 1 to 1000")
          else:
               balance -= with_draw
               print(f"new balance is : {balance}")
      elif payment == "deposit":
          deposit = float(input("how you want to deposit:\n"))
          if deposit > 1000 or deposit < 0:
              print("please enter from 1 to 1000")
          else:
             balance += deposit
             print(f"new balance is: {balance}")  
    else:
      attempts += 1  # Fixed: increments attempts correctly by 1
      attempts_left = max_attempts - attempts
      print(f"Incorrect PIN. Attempts left is: {attempts_left}")

      if attempts == max_attempts:
        print("You have been locked out due to too many failed attempts.")
        exit()

  elif name == "q":
    print("You have logged out.")
    break
  else:
    print("Please enter a valid name.")