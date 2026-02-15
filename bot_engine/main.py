import time
import schedule

def job():
    print("I'm working...")

schedule.every(10).seconds.do(job)

if __name__ == "__main__":
    print("Bot Engine Started")
    while True:
        schedule.run_pending()
        time.sleep(1)
