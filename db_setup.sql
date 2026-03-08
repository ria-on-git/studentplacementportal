drop database if exists placementPortal;
create database placementPortal;
use placementPortal;

create table students (
id int auto_increment primary key,
name varchar(100) not null,
email varchar(100) unique not null,
password varchar(255) not null,
department varchar(100),
cgpa float,
year int
);

create table jobs (
id int auto_increment primary key,
title varchar(100),
company varchar(100),
type varchar(50),
location varchar(100),
ctc varchar(50),
min_cgpa float,
tag varchar(50),
description text
);

create table applications (
id int auto_increment primary key,
student_id int,
job_id int,
applied_at timestamp default current_timestamp,
foreign key (student_id) references students(id),
foreign key (job_id) references jobs(id)
);

insert into jobs (title, company, type, location, ctc, min_cgpa, tag, description) values
('Software Engineer',            'Google',        'Full-time',  'Bangalore',    '32 LPA',  7.5, 'tech',       'Build and scale products used by billions.'),
('SDE Intern',                   'Microsoft',     'Internship', 'Hyderabad',    '80k/mo',  7.0, 'tech',       '6-month internship on Azure or Office 365.'),
('Analyst - Investment Banking', 'Goldman Sachs', 'Full-time',  'Mumbai',       '18 LPA',  8.0, 'finance',    'Work on M&A, IPO, and capital markets deals.'),
('Product Manager',              'Flipkart',      'Full-time',  'Bangalore',    '24 LPA',  7.5, 'tech',       'Own features end-to-end for India largest e-commerce platform.'),
('Strategy Consultant',          'McKinsey',      'Full-time',  'Delhi/Mumbai', '22 LPA',  8.5, 'consulting', 'Solve high-impact business problems for Fortune 500 clients.'),
('VLSI Design Engineer',         'Qualcomm',      'Full-time',  'Bangalore',    '14 LPA',  7.0, 'core',       'Work on next-gen chipset design for Snapdragon SoCs.'),
('Data Analyst Intern',          'Razorpay',      'Internship', 'Bangalore',    '50k/mo',  6.5, 'finance',    'Analyze payment and merchant data to drive growth decisions.'),
('Mechanical Design Intern',     'Tata Motors',   'Internship', 'Pune',         '25k/mo',  6.0, 'core',       'Work on EV powertrain and chassis design.');
