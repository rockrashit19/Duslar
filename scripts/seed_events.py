from datetime import datetime, timedelta, timezone
from random import randint, choice

from app.db.session import SessionLocal
from app.models.event import Event, Gender
from app.models.user import User

CITIES = ["Kazan", "Moscow", "Ufa", "Almetyevsk", "Naberezhnyie Chelny", "Kazan", "Moscow", "Saint Petersburg", "Kazan"]
LOCATIONS = ["ул. Пушкина, 10", "ул. Ленина, 5", "пр-т Мира, 1"]
TITLES = [
    "Встреча мусульман",
    "Совместный ифтар",
    "Знакомства оффлайн",
    "Лекция и общение",
]

def now_utc():
    return datetime.now(timezone.utc)

def main(n: int = 12):
    db = SessionLocal()
    try:
        creator = db.get(User, 123456789)
        if creator is None:
            from app.models.user import UserRole
            creator = User(id=123456789, full_name="Seed User", role=UserRole.user)
            db.add(creator)
            db.commit()
            db.refresh(creator)
        
        base = now_utc().replace(minute=0, second=0, microsecond=0)
        for i in range(n):
            shift_days = choice([-5, -3, -1, 0, 1, 3, 5, 7, 10, 14])
            dt = base + timedelta(days=shift_days, hours=randint(9, 20) - base.hour)
            e = Event(
                title=f"{choice(TITLES)} #{i+1}",
                description="Сидовое событие для проверки фильтров",
                location=choice(LOCATIONS),
                city=choice(CITIES),
                date_time=dt,
                gender_restriction=Gender.all,
                max_participants=choice([None, 10, 20, 30]),
                creator_id=creator.id,
            )      
            db.add(e)
        db.commit()
        print(f"Seeded {n} events")
    finally:
        db.close()

if __name__ == "__main__":
    main()  